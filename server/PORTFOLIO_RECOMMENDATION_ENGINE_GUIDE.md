# Portfolio Recommendation Engine (NEPSE)

Endpoint:

- `POST /api/v1/portfolio/recommend`

This endpoint queries NEPSE **historical closes** from Postgres (`prices` + `companies` + latest `financials.market_cap`) and calls a **Python Modern Portfolio Theory** optimizer to produce a constrained allocation.

## Input

```json
{
  "investmentAmount": 1000000,
  "riskTolerance": "medium",
  "duration": "long",
  "symbols": ["NABIL", "HBL", "NTC"],
  "maxPerStock": 0.3,
  "maxPerSector": 0.55,
  "ml": false
}
```

- `riskTolerance`: `low | medium | high`
- `duration`: `short | medium | long` (controls lookback window)
- `symbols` optional: if omitted the engine uses whatever is present in `prices` (recommended to pass a curated universe in production)
- Constraints:
  - per-stock cap defaults to `0.30`
  - per-sector cap defaults to `0.35/0.55/0.70` for `low/medium/high`

## Output

```json
{
  "success": true,
  "data": {
    "expectedReturnPct": 12.3,
    "volatilityPct": 18.9,
    "sharpeRatio": 0.65,
    "riskScore": 52.8,
    "allocation": [
      { "symbol": "NABIL", "weight": 25.0, "amount": 250000, "sector": "Banking" }
    ]
  }
}
```

## Python engine

Location:

- `server/python/portfolio_engine`

Dependencies (install in your runtime image / VM):

- `server/python/portfolio_engine/requirements.txt`

The engine uses SciPy SLSQP when available; otherwise it falls back to a NumPy random search.

## Runtime configuration

Env vars (see `server/.env.example`):

- `PYTHON_BIN` (default `python`)
- `PYTHON_PORTFOLIO_ENGINE_PATH` (defaults to `server/python/portfolio_engine/main.py`)
- `PORTFOLIO_ENGINE_TIMEOUT_MS` (default `15000`)

## cURL

```bash
curl -X POST "http://localhost:3001/api/v1/portfolio/recommend" ^
  -H "Content-Type: application/json" ^
  -d "{\"investmentAmount\":1000000,\"riskTolerance\":\"medium\",\"duration\":\"long\",\"maxPerStock\":0.3}"
```

