-- Initialize database extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for better performance
-- These will be created by Prisma migrations, but keeping for reference

-- Set up database timezone
SET timezone = 'Asia/Kathmandu';
