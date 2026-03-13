from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd


@dataclass(frozen=True)
class EngineConfig:
    max_per_stock: float = 0.30
    max_per_sector: float = 0.55
    min_weight: float = 0.01
    annualization: int = 252


def _risk_aversion(risk_tolerance: str) -> float:
    rt = (risk_tolerance or "").lower()
    if rt == "low":
        return 12.0
    if rt == "high":
        return 2.5
    return 6.0  # medium default


def _safe_float(x: Any) -> Optional[float]:
    try:
        if x is None:
            return None
        v = float(x)
        if math.isfinite(v):
            return v
        return None
    except Exception:
        return None


def _prepare_price_frame(rows: List[Dict[str, Any]]) -> Tuple[pd.DataFrame, Dict[str, str], Dict[str, Optional[float]]]:
    df = pd.DataFrame(rows)
    if df.empty:
        raise ValueError("No price rows provided")

    required = {"symbol", "date", "close"}
    missing = required.difference(df.columns)
    if missing:
        raise ValueError(f"Missing required fields in price rows: {sorted(missing)}")

    df["symbol"] = df["symbol"].astype(str).str.upper().str.strip()
    df["date"] = pd.to_datetime(df["date"], utc=True, errors="coerce").dt.date
    df["close"] = df["close"].map(_safe_float)

    df = df.dropna(subset=["symbol", "date", "close"])
    if df.empty:
        raise ValueError("No valid price rows after cleaning")

    sector_by_symbol: Dict[str, str] = {}
    if "sector" in df.columns:
        for sym, sec in zip(df["symbol"], df["sector"], strict=False):
            if sym and isinstance(sec, str) and sec.strip():
                sector_by_symbol.setdefault(sym, sec.strip())

    mcap_by_symbol: Dict[str, Optional[float]] = {}
    if "marketCap" in df.columns:
        for sym, mc in zip(df["symbol"], df["marketCap"], strict=False):
            if sym:
                mcap_by_symbol[sym] = _safe_float(mc)

    pivot = (
        df.pivot_table(index="date", columns="symbol", values="close", aggfunc="last")
        .sort_index()
        .astype(float)
    )

    # Fill small gaps, drop very sparse series.
    pivot = pivot.ffill(limit=3).bfill(limit=1)
    coverage = pivot.notna().mean(axis=0)
    pivot = pivot.loc[:, coverage >= 0.80]

    if pivot.shape[1] < 3:
        raise ValueError("Insufficient symbols with enough history after cleaning (need >= 3)")

    return pivot, sector_by_symbol, mcap_by_symbol


def _compute_mu_cov(closes: pd.DataFrame, annualization: int) -> Tuple[np.ndarray, np.ndarray, List[str]]:
    returns = closes.pct_change().dropna(how="any")
    if returns.shape[0] < 30:
        raise ValueError("Insufficient return observations (need >= 30 days)")

    symbols = list(returns.columns)
    mu = returns.mean(axis=0).to_numpy(dtype=float) * annualization
    cov = returns.cov().to_numpy(dtype=float) * annualization

    # Numerical stabilization
    cov = (cov + cov.T) / 2.0
    cov += np.eye(len(symbols)) * 1e-8
    return mu, cov, symbols


def _sector_constraints(symbols: List[str], sector_by_symbol: Dict[str, str], max_per_sector: float):
    sector_to_indices: Dict[str, List[int]] = {}
    for i, sym in enumerate(symbols):
        sec = sector_by_symbol.get(sym, "Unknown")
        sector_to_indices.setdefault(sec, []).append(i)

    constraints = []
    for sec, idxs in sector_to_indices.items():
        if len(idxs) <= 1:
            continue
        constraints.append((sec, idxs, max_per_sector))
    return constraints


def _project_constraints(
    w: np.ndarray,
    symbols: List[str],
    sector_by_symbol: Dict[str, str],
    max_per_stock: float,
    max_per_sector: float,
    iters: int = 10,
) -> np.ndarray:
    w = np.clip(w, 0.0, max_per_stock)
    if w.sum() <= 0:
        w = np.ones_like(w) / len(w)
    w = w / w.sum()

    sector_groups = _sector_constraints(symbols, sector_by_symbol, max_per_sector)
    for _ in range(iters):
        w = np.clip(w, 0.0, max_per_stock)
        w = w / w.sum()

        changed = False
        for _, idxs, cap in sector_groups:
            sec_sum = float(w[idxs].sum())
            if sec_sum > cap + 1e-12:
                scale = cap / sec_sum
                w[idxs] *= scale
                changed = True

        if changed:
            remainder = 1.0 - float(w.sum())
            if remainder > 1e-12:
                slack = max_per_stock - w
                slack[slack < 0] = 0
                slack_sum = float(slack.sum())
                if slack_sum > 0:
                    w += remainder * (slack / slack_sum)
            w = w / w.sum()
        else:
            break

    return w / w.sum()


def _optimize_with_scipy(
    mu: np.ndarray,
    cov: np.ndarray,
    symbols: List[str],
    sector_by_symbol: Dict[str, str],
    cfg: EngineConfig,
    risk_tolerance: str,
) -> np.ndarray:
    from scipy.optimize import minimize  # type: ignore

    n = len(symbols)
    lam = _risk_aversion(risk_tolerance)

    def objective(w: np.ndarray) -> float:
        ret = float(mu @ w)
        var = float(w.T @ cov @ w)
        return -(ret - lam * var)

    constraints = [{"type": "eq", "fun": lambda w: float(np.sum(w) - 1.0)}]
    for _, idxs, cap in _sector_constraints(symbols, sector_by_symbol, cfg.max_per_sector):
        constraints.append({"type": "ineq", "fun": lambda w, idxs=idxs, cap=cap: float(cap - np.sum(w[idxs]))})

    bounds = [(0.0, cfg.max_per_stock) for _ in range(n)]
    x0 = np.ones(n) / n

    res = minimize(objective, x0=x0, method="SLSQP", bounds=bounds, constraints=constraints, options={"maxiter": 400})
    if not res.success or res.x is None:
        raise RuntimeError(f"Optimization failed: {res.message}")

    w = np.array(res.x, dtype=float)
    return _project_constraints(w, symbols, sector_by_symbol, cfg.max_per_stock, cfg.max_per_sector)


def _optimize_random_search(
    mu: np.ndarray,
    cov: np.ndarray,
    symbols: List[str],
    sector_by_symbol: Dict[str, str],
    cfg: EngineConfig,
    risk_tolerance: str,
    samples: int = 12000,
    seed: int = 7,
) -> np.ndarray:
    rng = np.random.default_rng(seed)
    n = len(symbols)
    lam = _risk_aversion(risk_tolerance)

    best_w = np.ones(n) / n
    best_score = -1e18

    # Dirichlet proposals -> projected to constraints
    for _ in range(samples):
        w = rng.dirichlet(np.ones(n))
        w = _project_constraints(w, symbols, sector_by_symbol, cfg.max_per_stock, cfg.max_per_sector)

        ret = float(mu @ w)
        var = float(w.T @ cov @ w)
        score = ret - lam * var
        if score > best_score:
            best_score = score
            best_w = w

    return best_w


def _maybe_ml_expected_returns(closes: pd.DataFrame, mu_hist: np.ndarray, symbols: List[str]) -> np.ndarray:
    try:
        from sklearn.linear_model import Ridge  # type: ignore
    except Exception:
        return mu_hist

    returns = closes.pct_change().dropna(how="any")
    if returns.shape[0] < 60:
        return mu_hist

    feats = []
    targets = []
    for sym in symbols:
        s = returns[sym]
        # simple features: 20d momentum, 20d vol
        mom = s.rolling(20).mean()
        vol = s.rolling(20).std()
        X = pd.concat([mom, vol], axis=1).dropna()
        if X.shape[0] < 40:
            continue
        y = s.loc[X.index].shift(-5)  # 1-week ahead return
        X = X.iloc[:-5]
        y = y.iloc[:-5]
        if X.empty:
            continue
        feats.append(X.to_numpy())
        targets.append(y.to_numpy())

    if not feats:
        return mu_hist

    X_all = np.vstack(feats)
    y_all = np.concatenate(targets)
    model = Ridge(alpha=1.0, fit_intercept=True)
    model.fit(X_all, y_all)

    mu_adj = mu_hist.copy()
    for i, sym in enumerate(symbols):
        s = returns[sym]
        mom = s.rolling(20).mean().iloc[-1]
        vol = s.rolling(20).std().iloc[-1]
        if not (np.isfinite(mom) and np.isfinite(vol)):
            continue
        pred_week = float(model.predict(np.array([[mom, vol]]))[0])
        # Blend: 80% historical mean, 20% ML signal annualized approx.
        mu_adj[i] = 0.8 * mu_hist[i] + 0.2 * (pred_week * 52.0)
    return mu_adj


def run_engine(payload: Dict[str, Any]) -> Dict[str, Any]:
    investment_amount = _safe_float(payload.get("investmentAmount")) or 0.0
    risk_tolerance = str(payload.get("riskTolerance") or "medium").lower()
    duration = str(payload.get("duration") or "medium").lower()

    cfg = EngineConfig(
        max_per_stock=float(payload.get("maxPerStock") or 0.30),
        max_per_sector=float(payload.get("maxPerSector") or 0.55),
        min_weight=float(payload.get("minWeight") or 0.01),
    )

    closes, sector_by_symbol, _ = _prepare_price_frame(payload.get("prices") or [])
    mu_hist, cov, symbols = _compute_mu_cov(closes, cfg.annualization)
    mu = _maybe_ml_expected_returns(closes, mu_hist, symbols) if payload.get("ml") else mu_hist

    try:
        w = _optimize_with_scipy(mu, cov, symbols, sector_by_symbol, cfg, risk_tolerance)
        method = "scipy_slsqp"
    except Exception:
        w = _optimize_random_search(mu, cov, symbols, sector_by_symbol, cfg, risk_tolerance)
        method = "random_search"

    w = _project_constraints(w, symbols, sector_by_symbol, cfg.max_per_stock, cfg.max_per_sector)

    port_return = float(mu @ w)
    port_var = float(w.T @ cov @ w)
    port_vol = float(math.sqrt(max(port_var, 0.0)))
    sharpe = float(port_return / port_vol) if port_vol > 1e-12 else 0.0

    alloc = []
    for sym, weight in sorted(zip(symbols, w, strict=False), key=lambda x: x[1], reverse=True):
        if weight < cfg.min_weight:
            continue
        alloc.append(
            {
                "symbol": sym,
                "weight": round(float(weight) * 100.0, 2),
                "amount": round(investment_amount * float(weight), 2) if investment_amount else None,
                "sector": sector_by_symbol.get(sym, "Unknown"),
            }
        )

    # Risk score 0-100: lower vol => higher score (NEPSE typically volatile; clamp to [0, 40%])
    vol_clamped = min(max(port_vol, 0.0), 0.40)
    risk_score = round((1.0 - vol_clamped / 0.40) * 100.0, 1)

    return {
        "method": method,
        "duration": duration,
        "riskTolerance": risk_tolerance,
        "expectedReturnPct": round(port_return * 100.0, 2),
        "volatilityPct": round(port_vol * 100.0, 2),
        "sharpeRatio": round(sharpe, 3),
        "riskScore": risk_score,
        "allocation": alloc,
        "constraints": {
            "maxPerStock": cfg.max_per_stock,
            "maxPerSector": cfg.max_per_sector,
        },
        "universeSize": len(symbols),
    }

