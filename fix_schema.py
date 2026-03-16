import re

file_path = 'server/prisma/schema.prisma'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove @db.Decimal(p, s) from Float fields
# Pattern: finds "Float" or "Float?" followed by any attributes, then @db.Decimal(...)
# We replace it by just the part before @db.Decimal
# Regex explanation:
# (Float\??\s+(?:@[a-zA-Z]+\s*)*)  -> Group 1: Float or Float? and preceding attributes like @map
# @db\.Decimal\(\d+,\s*\d+\)        -> The part to remove
content = re.sub(r'(Float\??\s+.*?)@db\.Decimal\(\d+,\s*\d+\)', r'\1', content)

# 2. Fix User model relations
# Remove 'financialReports FinancialReport[]' which is invalid
# Add 'aiReports AIReport[]' which is missing
if 'financialReports FinancialReport[]' in content:
    content = content.replace('financialReports FinancialReport[]', 'aiReports AIReport[]')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Schema fixed.")
