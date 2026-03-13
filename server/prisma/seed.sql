-- Seed data for FinSathi AI database

-- Insert sample companies (Nepalese companies)
INSERT INTO "companies" (id, name, symbol, sector, created_at, updated_at) VALUES
('comp_001', 'Nabil Bank Limited', 'NABIL', 'Banking', NOW(), NOW()),
('comp_002', 'Commercial Bank of Nepal', 'COMB', 'Banking', NOW(), NOW()),
('comp_003', 'Nepal Telecom', 'NTC', 'Telecommunications', NOW(), NOW()),
('comp_004', 'Unilever Nepal Limited', 'UNL', 'Consumer Goods', NOW(), NOW()),
('comp_005', 'Nepal Insurance Company', 'NIC', 'Insurance', NOW(), NOW());

-- Insert sample financial reports for companies
INSERT INTO "financial_reports" (
    id, company_id, year, revenue, net_profit, total_assets, total_liabilities, 
    equity, eps, roe, debt_ratio, profit_margin, eps_growth, created_at, updated_at
) VALUES
-- Nabil Bank 2023
('fin_001', 'comp_001', 2023, 25450000000.00, 3250000000.00, 285000000000.00, 245000000000.00, 
 40000000000.00, 125.50, 8.1250, 0.8600, 12.7750, 15.2500, NOW(), NOW()),
-- Nabil Bank 2022
('fin_002', 'comp_001', 2022, 22800000000.00, 2820000000.00, 265000000000.00, 228000000000.00, 
 37000000000.00, 108.90, 7.6216, 0.8600, 12.3680, 12.5000, NOW(), NOW()),
-- Commercial Bank 2023
('fin_003', 'comp_002', 2023, 18900000000.00, 2150000000.00, 198000000000.00, 168000000000.00, 
 30000000000.00, 89.60, 7.1667, 0.8480, 11.3750, 18.7500, NOW(), NOW()),
-- Nepal Telecom 2023
('fin_004', 'comp_003', 2023, 42500000000.00, 8900000000.00, 65000000000.00, 18000000000.00, 
 47000000000.00, 45.20, 18.9360, 0.2769, 20.9410, 8.7500, NOW(), NOW()),
-- Unilever Nepal 2023
('fin_005', 'comp_004', 2023, 12500000000.00, 1850000000.00, 8500000000.00, 3200000000.00, 
 5300000000.00, 275.80, 34.9050, 0.3765, 14.8000, 22.5000, NOW(), NOW());

-- Insert sample AI reports
INSERT INTO "ai_reports" (
    id, company_id, financial_report_id, year, analysis_text, risk_score, created_at, updated_at
) VALUES
-- Nabil Bank Analysis
('ai_001', 'comp_001', 'fin_001', 2023, 
'Nabil Bank demonstrates strong financial performance with healthy profit margins and stable asset quality. 
The bank shows consistent growth in net profit and maintains adequate capital ratios. 
Risk factors include increasing competition in the banking sector and potential economic headwinds.', 
 3.25, NOW(), NOW()),
-- Commercial Bank Analysis
('ai_002', 'comp_002', 'fin_003', 2023,
'Commercial Bank shows moderate performance with improving efficiency ratios. 
The bank has been focusing on digital transformation and cost optimization. 
Key challenges include maintaining asset quality in a competitive environment.',
 4.10, NOW(), NOW()),
-- Nepal Telecom Analysis
('ai_003', 'comp_003', 'fin_004', 2023,
'Nepal Telecom maintains market leadership with strong revenue growth and profitability. 
The company faces challenges from increasing competition and regulatory changes. 
Investment in 5G infrastructure and digital services presents growth opportunities.',
 2.85, NOW(), NOW());

-- Create sample users for testing
INSERT INTO "users" (id, email, password_hash, role, created_at, updated_at) VALUES
('user_001', 'admin@finsathi.ai', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6QJw/2EjW', 'PRO', NOW(), NOW()),
('user_002', 'user@finsathi.ai', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6QJw/2EjW', 'FREE', NOW(), NOW());

-- Create sample subscriptions
INSERT INTO "subscriptions" (id, user_id, plan, status, start_date, end_date, created_at, updated_at) VALUES
('sub_001', 'user_001', 'PRO', 'ACTIVE', NOW(), NOW() + INTERVAL '1 year', NOW(), NOW()),
('sub_002', 'user_002', 'FREE', 'ACTIVE', NOW(), NULL, NOW(), NOW());

-- Create sample loan simulations
INSERT INTO "loan_simulations" (
    id, user_id, principal, interest_rate, tenure, emi, total_payment, created_at, updated_at
) VALUES
('loan_001', 'user_001', 5000000.00, 12.50, 60, 112625.50, 6757530.00, NOW(), NOW()),
('loan_002', 'user_001', 10000000.00, 11.75, 120, 141975.25, 17037030.00, NOW(), NOW()),
('loan_003', 'user_002', 3000000.00, 13.00, 36, 101252.75, 3645099.00, NOW(), NOW());
