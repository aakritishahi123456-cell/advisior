# Database Setup Guide for FinSathi AI

## Overview
This document provides instructions for setting up the PostgreSQL database for FinSathi AI using the Prisma schema.

## Prerequisites
- PostgreSQL 13+ installed
- Node.js 18+ installed
- Prisma CLI installed globally (`npm install -g prisma`)

## Schema Design

### Tables

#### Users
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `password_hash` (TEXT)
- `role` (ENUM: FREE, PRO)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### Companies
- `id` (UUID, Primary Key)
- `name` (TEXT)
- `symbol` (TEXT, Unique)
- `sector` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### Financial Reports
- `id` (UUID, Primary Key)
- `company_id` (UUID, Foreign Key)
- `year` (INTEGER)
- `revenue` (DECIMAL(15,2))
- `net_profit` (DECIMAL(15,2))
- `total_assets` (DECIMAL(15,2))
- `total_liabilities` (DECIMAL(15,2))
- `equity` (DECIMAL(15,2))
- `eps` (DECIMAL(10,4)) - Earnings Per Share
- `roe` (DECIMAL(8,4)) - Return on Equity
- `debt_ratio` (DECIMAL(8,4))
- `profit_margin` (DECIMAL(8,4))
- `eps_growth` (DECIMAL(8,4))
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### Loan Simulations
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `principal` (DECIMAL(15,2))
- `interest_rate` (DECIMAL(8,4))
- `tenure` (INTEGER) - in months
- `emi` (DECIMAL(15,2)) - Equated Monthly Installment
- `total_payment` (DECIMAL(15,2))
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### AI Reports
- `id` (UUID, Primary Key)
- `company_id` (UUID, Foreign Key, Nullable)
- `financial_report_id` (UUID, Foreign Key, Nullable)
- `year` (INTEGER, Nullable)
- `analysis_text` (TEXT)
- `risk_score` (DECIMAL(5,2))
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### Subscriptions
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `plan` (ENUM: FREE, PRO)
- `status` (ENUM: ACTIVE, CANCELLED, EXPIRED)
- `start_date` (TIMESTAMP)
- `end_date` (TIMESTAMP, Nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Indexes

### Performance Indexes
- `companies(symbol)` - For company symbol lookups
- `financial_reports(company_id)` - For company financial data
- `financial_reports(year)` - For year-based queries
- `financial_reports(company_id, year)` - Composite index for company-year queries
- `loan_simulations(user_id)` - For user loan history
- `ai_reports(company_id)` - For company AI analysis
- `ai_reports(year)` - For year-based AI reports
- `ai_reports(company_id, year)` - Composite index for company-year AI analysis
- `subscriptions(user_id)` - For user subscription lookups

## Setup Instructions

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your database credentials
DATABASE_URL="postgresql://username:password@localhost:5432/finsathi"
```

### 2. Database Creation
```bash
# Create database
createdb finsathi

# Or using psql
psql -c "CREATE DATABASE finsathi;"
```

### 3. Prisma Setup
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name initial_migration

# Or apply existing migration
npx prisma db push --force-reset
```

### 4. Seed Data
```bash
# Run seed script
npx prisma db seed

# Or manually run
node prisma/seed.js
```

### 5. Verify Setup
```bash
# View database in Prisma Studio
npx prisma studio

# Or connect with psql
psql DATABASE_URL
```

## Migration Files

### Initial Migration
The initial migration (`001_initial_migration.sql`) creates:
- All tables with proper constraints
- Foreign key relationships
- Indexes for performance
- Enum types

### Seed Data
The seed script includes:
- 5 sample Nepalese companies
- Financial reports for 2023
- Sample users (admin@finsathi.ai, user@finsathi.ai)
- Subscriptions for test users
- Sample loan simulations
- AI analysis reports

## Database Operations

### Common Queries

#### Get Company Financial Data
```sql
SELECT 
  c.name,
  c.symbol,
  fr.year,
  fr.revenue,
  fr.net_profit,
  fr.eps,
  fr.roe
FROM companies c
JOIN financial_reports fr ON c.id = fr.company_id
WHERE c.symbol = 'NABIL'
ORDER BY fr.year DESC;
```

#### User Loan History
```sql
SELECT 
  u.email,
  ls.principal,
  ls.interest_rate,
  ls.tenure,
  ls.emi,
  ls.total_payment,
  ls.created_at
FROM users u
JOIN loan_simulations ls ON u.id = ls.user_id
WHERE u.email = 'user@finsathi.ai'
ORDER BY ls.created_at DESC;
```

#### AI Risk Analysis by Company
```sql
SELECT 
  c.name,
  c.symbol,
  ar.year,
  ar.risk_score,
  ar.analysis_text
FROM companies c
JOIN ai_reports ar ON c.id = ar.company_id
WHERE c.symbol = 'NABIL'
ORDER BY ar.year DESC;
```

## Performance Considerations

1. **Index Usage**: The schema includes strategic indexes for common query patterns
2. **Data Types**: Using appropriate DECIMAL precision for financial calculations
3. **Foreign Keys**: Proper cascade and set null behaviors for data integrity
4. **Composite Indexes**: Multi-column indexes for complex queries

## Security

1. **Password Hashing**: User passwords are stored as bcrypt hashes
2. **Data Validation**: Prisma schema enforces data type constraints
3. **SQL Injection**: Prisma provides protection against SQL injection
4. **Connection Security**: Use SSL for database connections in production

## Backup and Recovery

### Backup
```bash
# Full database backup
pg_dump finsathi > backup_$(date +%Y%m%d).sql

# Schema only
pg_dump -s finsathi > schema_$(date +%Y%m%d).sql

# Data only
pg_dump -a finsathi > data_$(date +%Y%m%d).sql
```

### Restore
```bash
# Restore from backup
psql finsathi < backup_20231210.sql

# Restore with drop
psql -c "DROP DATABASE IF EXISTS finsathi;"
createdb finsathi
psql finsathi < backup_20231210.sql
```

## Monitoring

### Query Performance
```sql
-- Slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Index usage
SELECT schemaname, tablename, indexname, idx_scan 
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

### Table Sizes
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Troubleshooting

### Common Issues

1. **Migration Failures**: Check database permissions and connection
2. **Seed Data Issues**: Verify foreign key relationships
3. **Performance**: Add indexes for slow queries
4. **Connection Issues**: Check DATABASE_URL format

### Debug Commands
```bash
# Reset database
npx prisma migrate reset

# Regenerate client
npx prisma generate

# Check migration status
npx prisma migrate status

# Validate schema
npx prisma validate
```
