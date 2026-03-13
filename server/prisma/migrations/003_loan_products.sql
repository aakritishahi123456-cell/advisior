-- CreateTable: loan_products
-- Stores scraped loan products and rates from Nepali banks (FinSathi AI)

CREATE TABLE IF NOT EXISTS "loan_products" (
    "id" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "loan_type" TEXT NOT NULL,
    "interest_rate" DECIMAL(8,4) NOT NULL,
    "interest_rate_max" DECIMAL(8,4),
    "loan_term" INTEGER,
    "minimum_income" DECIMAL(15,2),
    "max_loan_amount" DECIMAL(15,2),
    "processing_fee" DECIMAL(15,2),
    "eligibility_requirements" TEXT,
    "source_url" TEXT,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_products_pkey" PRIMARY KEY ("id")
);

-- Query and compare optimizations
CREATE INDEX IF NOT EXISTS "loan_products_loan_type_idx" ON "loan_products"("loan_type");
CREATE INDEX IF NOT EXISTS "loan_products_interest_rate_idx" ON "loan_products"("interest_rate");
CREATE INDEX IF NOT EXISTS "loan_products_bank_name_idx" ON "loan_products"("bank_name");

-- Prevent accidental duplicates from repeated scrapes
CREATE UNIQUE INDEX IF NOT EXISTS "loan_products_unique_source_idx"
ON "loan_products"("bank_name", "loan_type", "source_url", "loan_term");

