-- CreateEnum
CREATE TYPE "RiskTolerance" AS ENUM ('CONSERVATIVE', 'MODERATE', 'AGGRESSIVE');

-- CreateEnum
CREATE TYPE "FinancialGoal" AS ENUM ('RETIREMENT', 'HOUSE_PURCHASE', 'EDUCATION_FUND', 'WEALTH_GROWTH', 'EMERGENCY_FUND', 'DEBT_PAYOFF', 'VACATION', 'CAR_PURCHASE', 'WEDDING', 'BUSINESS_STARTUP', 'INHERITANCE_PLANNING', 'CHARITY_DONATION');

-- CreateTable
CREATE TABLE "financial_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "monthly_income" DECIMAL(15,2) NOT NULL,
    "monthly_expenses" DECIMAL(15,2) NOT NULL,
    "current_savings" DECIMAL(15,2) NOT NULL,
    "risk_tolerance" "RiskTolerance" NOT NULL,
    "investment_horizon_years" INTEGER NOT NULL,
    "financial_goal" "FinancialGoal" NOT NULL,
    "target_amount" DECIMAL(15,2),
    "target_date" TIMESTAMP(3),
    "monthly_contribution" DECIMAL(15,2),
    "emergency_fund_months" INTEGER,
    "insurance_coverage" BOOLEAN NOT NULL DEFAULT false,
    "dependents_count" INTEGER,
    "employment_status" TEXT,
    "annual_income_growth" DECIMAL(5,2),
    "preferred_investment_types" TEXT[],
    "investment_experience" TEXT,
    "liquidity_preference" TEXT,
    "tax_bracket" TEXT,
    "last_updated" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_recommendations" (
    "id" TEXT NOT NULL,
    "financial_profile_id" TEXT NOT NULL,
    "investment_type" TEXT NOT NULL,
    "recommendation_text" TEXT NOT NULL,
    "risk_level" TEXT NOT NULL,
    "expected_return" DECIMAL(5,2),
    "time_horizon" INTEGER,
    "minimum_investment" DECIMAL(15,2),
    "confidence_score" DECIMAL(3,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_goal_profiles" (
    "id" TEXT NOT NULL,
    "financial_profile_id" TEXT NOT NULL,
    "goal_type" TEXT NOT NULL,
    "goal_name" TEXT NOT NULL,
    "target_amount" DECIMAL(15,2) NOT NULL,
    "current_amount" DECIMAL(15,2) NOT NULL,
    "target_date" TIMESTAMP(3) NOT NULL,
    "monthly_contribution" DECIMAL(15,2) NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "progress_percentage" DECIMAL(5,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_goal_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "financial_profiles_user_id_idx" ON "financial_profiles"("user_id");

-- CreateIndex
CREATE INDEX "financial_profiles_user_id_financial_goal_idx" ON "financial_profiles"("user_id", "financial_goal");

-- CreateIndex
CREATE INDEX "financial_profiles_risk_tolerance_idx" ON "financial_profiles"("risk_tolerance");

-- CreateIndex
CREATE INDEX "financial_profiles_investment_horizon_years_idx" ON "financial_profiles"("investment_horizon_years");

-- CreateIndex
CREATE INDEX "financial_profiles_financial_goal_target_date_idx" ON "financial_profiles"("financial_goal", "target_date");

-- CreateIndex
CREATE INDEX "financial_profiles_monthly_income_idx" ON "financial_profiles"("monthly_income");

-- CreateIndex
CREATE INDEX "financial_profiles_created_at_idx" ON "financial_profiles"("created_at");

-- CreateIndex
CREATE INDEX "financial_profiles_last_updated_idx" ON "financial_profiles"("last_updated");

-- CreateIndex
CREATE UNIQUE INDEX "financial_profiles_user_id_financial_goal_key" ON "financial_profiles"("user_id", "financial_goal");

-- CreateIndex
CREATE INDEX "investment_recommendations_financial_profile_id_idx" ON "investment_recommendations"("financial_profile_id");

-- CreateIndex
CREATE INDEX "investment_recommendations_investment_type_idx" ON "investment_recommendations"("investment_type");

-- CreateIndex
CREATE INDEX "investment_recommendations_risk_level_idx" ON "investment_recommendations"("risk_level");

-- CreateIndex
CREATE INDEX "investment_recommendations_is_active_idx" ON "investment_recommendations"("is_active");

-- CreateIndex
CREATE INDEX "financial_goal_profiles_financial_profile_id_idx" ON "financial_goal_profiles"("financial_profile_id");

-- CreateIndex
CREATE INDEX "financial_goal_profiles_goal_type_idx" ON "financial_goal_profiles"("goal_type");

-- CreateIndex
CREATE INDEX "financial_goal_profiles_status_idx" ON "financial_goal_profiles"("status");

-- CreateIndex
CREATE INDEX "financial_goal_profiles_target_date_idx" ON "financial_goal_profiles"("target_date");

-- CreateIndex
CREATE INDEX "financial_goal_profiles_priority_idx" ON "financial_goal_profiles"("priority");

-- AddForeignKey
ALTER TABLE "financial_profiles" ADD CONSTRAINT "financial_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_recommendations" ADD CONSTRAINT "investment_recommendations_financial_profile_id_fkey" FOREIGN KEY ("financial_profile_id") REFERENCES "financial_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_goal_profiles" ADD CONSTRAINT "financial_goal_profiles_financial_profile_id_fkey" FOREIGN KEY ("financial_profile_id") REFERENCES "financial_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
