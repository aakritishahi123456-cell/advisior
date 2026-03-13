-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'FREE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_reports" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "revenue" DECIMAL(15,2) NOT NULL,
    "net_profit" DECIMAL(15,2) NOT NULL,
    "total_assets" DECIMAL(15,2) NOT NULL,
    "total_liabilities" DECIMAL(15,2) NOT NULL,
    "equity" DECIMAL(15,2) NOT NULL,
    "eps" DECIMAL(10,4) NOT NULL,
    "roe" DECIMAL(8,4) NOT NULL,
    "debt_ratio" DECIMAL(8,4) NOT NULL,
    "profit_margin" DECIMAL(8,4) NOT NULL,
    "eps_growth" DECIMAL(8,4) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_simulations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "principal" DECIMAL(15,2) NOT NULL,
    "interest_rate" DECIMAL(8,4) NOT NULL,
    "tenure" INTEGER NOT NULL,
    "emi" DECIMAL(15,2) NOT NULL,
    "total_payment" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_simulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_reports" (
    "id" TEXT NOT NULL,
    "company_id" TEXT,
    "financial_report_id" TEXT,
    "year" INTEGER,
    "analysis_text" TEXT NOT NULL,
    "risk_score" DECIMAL(5,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "companies_symbol_key" ON "companies"("symbol");

-- CreateIndex
CREATE INDEX "companies_symbol_idx" ON "companies"("symbol");

-- CreateIndex
CREATE INDEX "financial_reports_company_id_idx" ON "financial_reports"("company_id");

-- CreateIndex
CREATE INDEX "financial_reports_year_idx" ON "financial_reports"("year");

-- CreateIndex
CREATE INDEX "financial_reports_company_id_year_idx" ON "financial_reports"("company_id", "year");

-- CreateIndex
CREATE INDEX "loan_simulations_user_id_idx" ON "loan_simulations"("user_id");

-- CreateIndex
CREATE INDEX "ai_reports_company_id_idx" ON "ai_reports"("company_id");

-- CreateIndex
CREATE INDEX "ai_reports_year_idx" ON "ai_reports"("year");

-- CreateIndex
CREATE INDEX "ai_reports_company_id_year_idx" ON "ai_reports"("company_id", "year");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");

-- AddForeignKey
ALTER TABLE "financial_reports" ADD CONSTRAINT "financial_reports_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "loan_simulations" ADD CONSTRAINT "loan_simulations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ai_reports" ADD CONSTRAINT "ai_reports_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ai_reports" ADD CONSTRAINT "ai_reports_financial_report_id_fkey" FOREIGN KEY ("financial_report_id") REFERENCES "financial_reports"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
