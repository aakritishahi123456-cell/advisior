#!/usr/bin/env python3
"""
FinSathi AI — Nepal Bank Loan Product Scraper

Scrapes loan products/rates from selected Nepali banks and upserts into Postgres table `loan_products`.

Supported sources (initial):
- Himalayan Bank (HBL): HTML pages (base rate + loan product rates + home loan product page)
- NIC ASIA Bank: latest interest-rate PDF from Old Interest Rate page
- Global IME Bank: Home loan product page (fixed-rate scheme + eligibility)

Environment:
- DATABASE_URL (Postgres connection string), or pass --database-url
"""

from __future__ import annotations

import argparse
import dataclasses
import hashlib
import io
import os
import re
import sys
from datetime import datetime, timezone
from typing import Iterable, List, Optional, Tuple

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from pypdf import PdfReader

try:
    import psycopg2
    import psycopg2.extras
except Exception as exc:  # pragma: no cover
    raise SystemExit(
        "Missing dependency: psycopg2-binary. Install via `pip install -r server/scripts/requirements.txt`."
    ) from exc


LOAN_TYPES = {"HOME", "PERSONAL", "EDUCATION", "BUSINESS", "AUTO"}


@dataclasses.dataclass(frozen=True)
class LoanProduct:
    bank_name: str
    loan_type: str
    interest_rate: float
    interest_rate_max: Optional[float]
    loan_term: Optional[int]  # months
    minimum_income: Optional[float]
    max_loan_amount: Optional[float]
    processing_fee: Optional[float]
    eligibility_requirements: Optional[str]
    source_url: Optional[str]

    def stable_id(self) -> str:
        parts = [
            self.bank_name.strip().lower(),
            self.loan_type.strip().upper(),
            (self.source_url or "").strip().lower(),
            str(self.loan_term or ""),
        ]
        digest = hashlib.sha256("|".join(parts).encode("utf-8")).hexdigest()
        return digest[:32]


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _fetch(url: str, timeout: int = 40) -> str:
    resp = requests.get(
        url,
        timeout=timeout,
        headers={"User-Agent": "FinSathiAI-LoanScraper/1.0 (+https://finsathi.ai)"},
    )
    resp.raise_for_status()
    return resp.text


def _fetch_bytes(url: str, timeout: int = 60) -> bytes:
    resp = requests.get(
        url,
        timeout=timeout,
        headers={"User-Agent": "FinSathiAI-LoanScraper/1.0 (+https://finsathi.ai)"},
    )
    resp.raise_for_status()
    return resp.content


def _parse_money_to_npr(text: str) -> Optional[float]:
    """
    Best-effort conversion of amounts like "Rs. 30.00 Million" / "7.5 Mil." / "5 Lacs".
    Returns NPR numeric value.
    """
    cleaned = re.sub(r"\s+", " ", text).strip()
    match = re.search(r"(?i)\b(?:rs\.?|npr)\s*([0-9]+(?:\.[0-9]+)?)\s*(million|mil|lacs|lac|crore)?\b", cleaned)
    if not match:
        return None
    value = float(match.group(1))
    unit = (match.group(2) or "").lower()
    if unit in ("million", "mil"):
        return value * 1_000_000
    if unit in ("lac", "lacs"):
        return value * 100_000
    if unit == "crore":
        return value * 10_000_000
    return value


def _years_range_to_months(text: str) -> Optional[int]:
    cleaned = re.sub(r"\s+", " ", text).strip()
    match = re.search(r"(?i)\b(\d+(?:\.\d+)?)\s*to\s*(\d+(?:\.\d+)?)\s*years?\b", cleaned)
    if not match:
        match = re.search(r"(?i)\bup\s*to\s*(\d+(?:\.\d+)?)\s*years?\b", cleaned)
        if not match:
            return None
        return int(float(match.group(1)) * 12)
    return int(float(match.group(2)) * 12)


def _extract_percent_numbers(text: str) -> List[float]:
    return [float(x) for x in re.findall(r"(\d+(?:\.\d+)?)\s*%", text)]


def scrape_himalayan_bank() -> List[LoanProduct]:
    bank_name = "Himalayan Bank"
    base_rate_url = "https://www.himalayanbank.com/en/rates/base-rate"
    rates_url = "https://www.himalayanbank.com/en/rates/loan-products-rates"
    home_loan_url = "https://www.himalayanbank.com/en/loan-products/home-loan"

    base_rate_html = _fetch(base_rate_url)
    base_rate_text = BeautifulSoup(base_rate_html, "html.parser").get_text("\n")
    base_rate_matches = re.findall(r"(\d{1,2}-[A-Za-z]{3}-\d{4})\s+(\d+(?:\.\d+)?)%", base_rate_text)
    if not base_rate_matches:
        raise RuntimeError("Himalayan base rate not found")
    # Page is listed newest-first; use first match.
    base_rate = float(base_rate_matches[0][1])

    rates_html = _fetch(rates_url)
    rates_text = BeautifulSoup(rates_html, "html.parser").get_text("\n")

    products: List[LoanProduct] = []

    # Fixed-rate consumer loans (explicit annual rates)
    fixed_lines = [
        ("HOME", r"Home Loan .*Upto 7 Years.*?(\d+(?:\.\d+)?)%\s*per annum", 84),
        ("EDUCATION", r"Education Loan .*Upto 7 Years.*?(\d+(?:\.\d+)?)%\s*per annum", 84),
        ("AUTO", r"Hire Purchase .*Up to 7 Years.*?(\d+(?:\.\d+)?)%\s*per annum", 84),
        ("PERSONAL", r"Mortgage Loan .*Upto 7 Years.*?(\d+(?:\.\d+)?)%\s*per annum", 84),
    ]
    for loan_type, pattern, term_months in fixed_lines:
        match = re.search(pattern, rates_text, flags=re.IGNORECASE | re.DOTALL)
        if not match:
            continue
        rate = float(match.group(1))
        products.append(
            LoanProduct(
                bank_name=bank_name,
                loan_type=loan_type,
                interest_rate=rate,
                interest_rate_max=None,
                loan_term=term_months,
                minimum_income=None,
                max_loan_amount=None,
                processing_fee=None,
                eligibility_requirements=None,
                source_url=rates_url,
            )
        )

    # Business loan proxy from the standard term loan row: Base Rate + above 2.50% up to 4.00% p.a.
    business_match = re.search(
        r"Standard Term Loan\s+Base Rate \+\s*above\s*(\d+(?:\.\d+)?)%\s*up to\s*(\d+(?:\.\d+)?)%",
        rates_text,
        flags=re.IGNORECASE,
    )
    if business_match:
        min_premium = float(business_match.group(1))
        max_premium = float(business_match.group(2))
        products.append(
            LoanProduct(
                bank_name=bank_name,
                loan_type="BUSINESS",
                interest_rate=base_rate + min_premium,
                interest_rate_max=base_rate + max_premium,
                loan_term=None,
                minimum_income=None,
                max_loan_amount=None,
                processing_fee=None,
                eligibility_requirements=f"Floating rate derived from Base Rate {base_rate:.2f}% + premium range.",
                source_url=rates_url,
            )
        )

    # Home loan page: eligibility + term + limits (use premier range as representative floating product)
    home_html = _fetch(home_loan_url)
    home_text = BeautifulSoup(home_html, "html.parser").get_text("\n")

    eligibility_section = None
    eligibility_match = re.search(r"Basic Eligibility Criteria\s*(.*?)\s*Repayment Of Home Loan", home_text, flags=re.IGNORECASE | re.DOTALL)
    if eligibility_match:
        eligibility_section = re.sub(r"\n{3,}", "\n\n", eligibility_match.group(1)).strip()

    tenure_months = _years_range_to_months(home_text)  # picks the max in "3 to 25 Years"

    max_amount = None
    max_amount_match = re.search(r"to\s*Rs\.\s*([0-9]+(?:\.[0-9]+)?)\s*Million", home_text, flags=re.IGNORECASE)
    if max_amount_match:
        max_amount = float(max_amount_match.group(1)) * 1_000_000

    floating_match = re.search(r"Base Rate \+\s*0\.50%\s*up to\s*2\.50%", home_text, flags=re.IGNORECASE)
    if floating_match:
        products.append(
            LoanProduct(
                bank_name=bank_name,
                loan_type="HOME",
                interest_rate=base_rate + 0.50,
                interest_rate_max=base_rate + 2.50,
                loan_term=tenure_months,
                minimum_income=None,
                max_loan_amount=max_amount,
                processing_fee=None,
                eligibility_requirements=eligibility_section,
                source_url=home_loan_url,
            )
        )

    return products


def _nicasia_latest_interest_pdf_url(old_interest_rate_html: str) -> str:
    soup = BeautifulSoup(old_interest_rate_html, "html.parser")
    # First link under "Interest Rate 2082/83" section is most recent on the page at time of writing.
    for a in soup.select("a"):
        href = a.get("href") or ""
        if "cms.nicasiabank.com/framework/uploads/interest-rate/" in href:
            return href
    raise RuntimeError("NIC ASIA interest-rate PDF link not found")


def _parse_nicasia_interest_pdf(text: str) -> Tuple[float, dict]:
    base_rate_match = re.search(r"Average Base Rate .*?:\s*([0-9]+(?:\.[0-9]+)?)%", text, flags=re.IGNORECASE)
    if not base_rate_match:
        raise RuntimeError("NIC ASIA base rate not found in PDF")
    base_rate = float(base_rate_match.group(1))

    def premium_range(label_regex: str) -> Optional[Tuple[float, float]]:
        match = re.search(label_regex + r".*?([0-9]+(?:\.[0-9]+)?)%\s+([0-9]+(?:\.[0-9]+)?)%", text, flags=re.IGNORECASE | re.DOTALL)
        if not match:
            return None
        return (float(match.group(1)), float(match.group(2)))

    ranges = {}
    ranges["HOME"] = premium_range(r"\bHome Loan\b")

    # Auto: choose best (lowest min premium) among auto variants
    auto_lines = re.findall(r"\bAuto Loan[^\n]*?([0-9]+(?:\.[0-9]+)?)%\s+([0-9]+(?:\.[0-9]+)?)%", text, flags=re.IGNORECASE)
    if auto_lines:
        mins = [float(x[0]) for x in auto_lines]
        maxs = [float(x[1]) for x in auto_lines]
        ranges["AUTO"] = (min(mins), max(maxs))
    else:
        ranges["AUTO"] = None

    # Personal: pick the most favorable regulatory retail portfolio line if present, else fall back.
    personal_reg = premium_range(r"Personal Term Loan.*?Regulatory Retail Portfolio")
    personal_any = premium_range(r"Personal Term Loan secured by Real Estate")
    ranges["PERSONAL"] = personal_reg or personal_any

    # Business: pick Easy Business Loan line if present.
    ranges["BUSINESS"] = premium_range(r"\bEasy Business Loan\b") or premium_range(r"\bPremium Business Loan\b") or premium_range(r"\bSmall Business Loan\b")

    # Education: not always listed explicitly; approximate using "Other Loans" if present.
    ranges["EDUCATION"] = premium_range(r"\bEducation Loan\b") or premium_range(r"\bOther Loans\b")

    return base_rate, ranges


def scrape_nic_asia_bank() -> List[LoanProduct]:
    bank_name = "NIC ASIA Bank"
    old_rates_url = "https://www.nicasiabank.com/old-interest-rate/"

    old_html = _fetch(old_rates_url)
    pdf_url = _nicasia_latest_interest_pdf_url(old_html)

    pdf_bytes = _fetch_bytes(pdf_url)
    reader = PdfReader(io.BytesIO(pdf_bytes))
    pdf_text = "\n".join(page.extract_text() or "" for page in reader.pages)

    base_rate, ranges = _parse_nicasia_interest_pdf(pdf_text)

    products: List[LoanProduct] = []
    for loan_type in sorted(LOAN_TYPES):
        pr = ranges.get(loan_type)
        if not pr:
            continue
        min_premium, max_premium = pr
        products.append(
            LoanProduct(
                bank_name=bank_name,
                loan_type=loan_type,
                interest_rate=base_rate + min_premium,
                interest_rate_max=base_rate + max_premium,
                loan_term=None,
                minimum_income=None,
                max_loan_amount=None,
                processing_fee=None,
                eligibility_requirements=f"Floating rate derived from Average Base Rate {base_rate:.2f}% + premium range (from interest-rate PDF).",
                source_url=pdf_url,
            )
        )
    return products


def scrape_global_ime_bank() -> List[LoanProduct]:
    bank_name = "Global IME Bank"
    home_url = "https://www.globalimebank.com/products/loans/home-loan/"

    html = _fetch(home_url)
    text = BeautifulSoup(html, "html.parser").get_text("\n")

    eligibility_match = re.search(r"Home Loan Eligibility\s*(.*?)\s*Home Loan Interest Rate in Nepal", text, flags=re.IGNORECASE | re.DOTALL)
    eligibility = None
    if eligibility_match:
        eligibility = re.sub(r"\n{3,}", "\n\n", eligibility_match.group(1)).strip()

    # Fixed scheme card line: "7.99% for 7 years and BR+ 2% thereafter"
    fixed_match = re.search(r"(\d+(?:\.\d+)?)%\s*for\s*7\s*years", text, flags=re.IGNORECASE)
    fixed_rate = float(fixed_match.group(1)) if fixed_match else None

    products: List[LoanProduct] = []
    if fixed_rate is not None:
        products.append(
            LoanProduct(
                bank_name=bank_name,
                loan_type="HOME",
                interest_rate=fixed_rate,
                interest_rate_max=None,
                loan_term=84,
                minimum_income=None,
                max_loan_amount=None,
                processing_fee=None,
                eligibility_requirements=eligibility,
                source_url=home_url,
            )
        )
    return products


def scrape_nabil_bank() -> List[LoanProduct]:
    """
    Nabil Bank loan-rate information is not consistently published in a single machine-readable page.
    As an initial data source, this scraper uses the Kathmandu Post press release summary for
    "Nabil Sustainable Housing Loan" and a third-party base-rate table as a fallback for floating-rate calculation.
    """
    bank_name = "Nabil Bank"
    pr_url = "https://kathmandupost.com/money/2023/06/04/nabil-bank-launches-sustainable-housing-loan"
    base_rate_fallback_url = "https://saralbankingsewa.com/allbaserates"

    base_rate = None
    try:
        html = _fetch(base_rate_fallback_url)
        soup = BeautifulSoup(html, "html.parser")
        for row in soup.select("table tr"):
            cells = [c.get_text(" ", strip=True) for c in row.select("td")]
            if len(cells) < 3:
                continue
            if "nabil" in cells[1].lower():
                m = re.search(r"(\d+(?:\.\d+)?)%", cells[2])
                if m:
                    base_rate = float(m.group(1))
                    break
    except Exception:
        base_rate = None

    products: List[LoanProduct] = []

    # Fixed-rate offer (7 years) as reported in PR summary.
    products.append(
        LoanProduct(
            bank_name=bank_name,
            loan_type="HOME",
            interest_rate=10.49,
            interest_rate_max=None,
            loan_term=84,
            minimum_income=None,
            max_loan_amount=50_000_000,
            processing_fee=None,
            eligibility_requirements="Source: press release summary (third-party). Replace with official Nabil page/PDF when available.",
            source_url=pr_url,
        )
    )

    # Floating-rate offer: base rate + 1.00% premium (if base rate available).
    if base_rate is not None:
        products.append(
            LoanProduct(
                bank_name=bank_name,
                loan_type="HOME",
                interest_rate=base_rate + 1.00,
                interest_rate_max=base_rate + 1.50,
                loan_term=240,
                minimum_income=None,
                max_loan_amount=50_000_000,
                processing_fee=None,
                eligibility_requirements=f"Floating rate derived from base rate {base_rate:.2f}% + premium (press release summary).",
                source_url=pr_url,
            )
        )

    return products


def upsert_loan_products(database_url: str, products: Iterable[LoanProduct], dry_run: bool) -> int:
    rows = list(products)
    if dry_run:
        print(f"[dry-run] Would upsert {len(rows)} loan_products rows at {_now_iso()}")
        for row in rows[:10]:
            print(dataclasses.asdict(row))
        return len(rows)

    conn = psycopg2.connect(database_url)
    try:
        with conn:
            with conn.cursor() as cur:
                psycopg2.extras.execute_batch(
                    cur,
                    """
                    INSERT INTO "loan_products" (
                      "id",
                      "bank_name",
                      "loan_type",
                      "interest_rate",
                      "interest_rate_max",
                      "loan_term",
                      "minimum_income",
                      "max_loan_amount",
                      "processing_fee",
                      "eligibility_requirements",
                      "source_url",
                      "last_updated"
                    ) VALUES (
                      %(id)s,
                      %(bank_name)s,
                      %(loan_type)s,
                      %(interest_rate)s,
                      %(interest_rate_max)s,
                      %(loan_term)s,
                      %(minimum_income)s,
                      %(max_loan_amount)s,
                      %(processing_fee)s,
                      %(eligibility_requirements)s,
                      %(source_url)s,
                      %(last_updated)s
                    )
                    ON CONFLICT ("bank_name", "loan_type", "source_url", "loan_term")
                    DO UPDATE SET
                      "interest_rate" = EXCLUDED."interest_rate",
                      "interest_rate_max" = EXCLUDED."interest_rate_max",
                      "minimum_income" = EXCLUDED."minimum_income",
                      "max_loan_amount" = EXCLUDED."max_loan_amount",
                      "processing_fee" = EXCLUDED."processing_fee",
                      "eligibility_requirements" = EXCLUDED."eligibility_requirements",
                      "last_updated" = EXCLUDED."last_updated"
                    """,
                    [
                        {
                            "id": p.stable_id(),
                            "bank_name": p.bank_name,
                            "loan_type": p.loan_type,
                            "interest_rate": p.interest_rate,
                            "interest_rate_max": p.interest_rate_max,
                            "loan_term": p.loan_term,
                            "minimum_income": p.minimum_income,
                            "max_loan_amount": p.max_loan_amount,
                            "processing_fee": p.processing_fee,
                            "eligibility_requirements": p.eligibility_requirements,
                            "source_url": p.source_url,
                            "last_updated": datetime.now(timezone.utc),
                        }
                        for p in rows
                    ],
                    page_size=100,
                )
        return len(rows)
    finally:
        conn.close()


def main(argv: Optional[List[str]] = None) -> int:
    load_dotenv()

    parser = argparse.ArgumentParser(description="Scrape Nepali bank loan products into Postgres (loan_products).")
    parser.add_argument(
        "--banks",
        default="himalayan,nicasia,globalime,nabil",
        help="Comma-separated: himalayan,nicasia,globalime,nabil",
    )
    parser.add_argument("--database-url", default=os.getenv("DATABASE_URL"), help="Postgres connection string (defaults to env DATABASE_URL)")
    parser.add_argument("--dry-run", action="store_true", help="Parse sources but do not write to DB")
    args = parser.parse_args(argv)

    selected = {b.strip().lower() for b in args.banks.split(",") if b.strip()}
    if not selected:
        print("No banks selected.", file=sys.stderr)
        return 2

    products: List[LoanProduct] = []
    if "himalayan" in selected:
        products.extend(scrape_himalayan_bank())
    if "nicasia" in selected:
        products.extend(scrape_nic_asia_bank())
    if "globalime" in selected:
        products.extend(scrape_global_ime_bank())
    if "nabil" in selected:
        products.extend(scrape_nabil_bank())

    # Normalize loan_type set
    normalized: List[LoanProduct] = []
    for p in products:
        lt = p.loan_type.strip().upper()
        if lt not in LOAN_TYPES:
            continue
        normalized.append(dataclasses.replace(p, loan_type=lt))

    if not args.database_url and not args.dry_run:
        print("DATABASE_URL is required (or use --dry-run).", file=sys.stderr)
        return 2

    count = upsert_loan_products(args.database_url or "", normalized, args.dry_run)
    print(f"Upserted {count} loan product rows at {_now_iso()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
