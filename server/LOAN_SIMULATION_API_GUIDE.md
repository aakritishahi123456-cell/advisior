# Loan Simulation API Guide

## Overview
The Loan Simulation API provides EMI calculation and loan analysis capabilities for FinSathi AI users. The API supports both authenticated and public endpoints with comprehensive validation and performance optimization.

## Base URL
```
Production: https://api.finsathi.ai/v1/loan
Development: http://localhost:3001/api/v1/loan
```

## Authentication
- **Public Endpoints**: No authentication required
- **Protected Endpoints**: JWT token required in Authorization header
- **Admin Endpoints**: Enterprise subscription required

## Rate Limiting
- **General**: 100 requests per 15 minutes
- **Strict**: 5 requests per 15 minutes (for EMI calculation)
- **Authenticated**: Higher limits based on subscription plan

## API Endpoints

### 1. Simulate Loan (Main Endpoint)
**POST** `/simulate`

Public endpoint for loan EMI calculation with database storage.

#### Request Body
```json
{
  "loanAmount": 1000000,
  "interestRate": 12.5,
  "tenureYears": 5
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "clu123abc456def789",
    "emi": 22472.44,
    "totalInterest": 348346.40,
    "totalPayment": 1348346.40,
    "processingTime": 45,
    "warnings": ["Interest rate is above market average"],
    "calculatedAt": "2024-03-10T12:00:00.000Z"
  },
  "message": "Loan simulation completed successfully",
  "meta": {
    "processingTime": "45ms"
  }
}
```

#### Validation Rules
- `loanAmount`: 10,000 - 100,000,000 NPR
- `interestRate`: 0 - 50%
- `tenureYears`: 1 - 30 years

### 2. Quick EMI Calculation
**POST** `/emi`

Public endpoint for fast EMI calculation without database storage.

#### Request Body
```json
{
  "loanAmount": 500000,
  "interestRate": 10,
  "tenureYears": 3
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "emi": 16133.94,
    "totalInterest": 80821.84,
    "totalPayment": 580821.84,
    "processingTime": "12ms",
    "calculatedAt": "2024-03-10T12:00:00.000Z"
  },
  "message": "EMI calculated successfully"
}
```

### 3. Get User Simulations
**GET** `/simulations`

Requires authentication. Returns paginated list of user's loan simulations.

#### Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sortBy`: Sort field (default: createdAt)
- `sortOrder`: Sort order (default: desc)

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": "clu123abc456def789",
      "amount": 1000000,
      "rate": 12.5,
      "tenure": 5,
      "emi": 22472.44,
      "totalInterest": 348346.40,
      "totalPayment": 1348346.40,
      "createdAt": "2024-03-10T12:00:00.000Z",
      "updatedAt": "2024-03-10T12:00:00.000Z"
    }
  ],
  "message": "Simulations retrieved successfully",
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

### 4. Get Specific Simulation
**GET** `/simulations/:id`

Requires authentication. Returns detailed simulation information.

#### Response
```json
{
  "success": true,
  "data": {
    "id": "clu123abc456def789",
    "amount": 1000000,
    "rate": 12.5,
    "tenure": 5,
    "emi": 22472.44,
    "totalInterest": 348346.40,
    "totalPayment": 1348346.40,
    "createdAt": "2024-03-10T12:00:00.000Z",
    "updatedAt": "2024-03-10T12:00:00.000Z",
    "monthlyRate": 0.0104,
    "totalMonths": 60,
    "interestToPrincipalRatio": 34.83
  },
  "message": "Simulation retrieved successfully"
}
```

### 5. Delete Simulation
**DELETE** `/simulations/:id`

Requires authentication. Deletes a specific simulation.

#### Response
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Simulation deleted successfully"
  },
  "message": "Simulation deleted successfully"
}
```

### 6. Get Simulation Statistics
**GET** `/simulations/stats`

Requires authentication. Returns user's simulation statistics.

#### Response
```json
{
  "success": true,
  "data": {
    "totalSimulations": 15,
    "totalAmount": 12500000,
    "averageEMI": 18543.22,
    "recentSimulations": [
      {
        "id": "clu123abc456def789",
        "amount": 1000000,
        "emi": 22472.44,
        "createdAt": "2024-03-10T12:00:00.000Z"
      }
    ],
    "calculatedAt": "2024-03-10T12:00:00.000Z"
  },
  "message": "Simulation statistics retrieved successfully"
}
```

### 7. Compare Simulations
**POST** `/simulations/compare`

Requires authentication. Compare multiple simulations.

#### Request Body
```json
{
  "simulationIds": [
    "clu123abc456def789",
    "clu456def789abc123",
    "clu789abc123def456"
  ]
}
```

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": "clu123abc456def789",
      "amount": 1000000,
      "emi": 22472.44,
      "totalInterest": 348346.40,
      "totalPayment": 1348346.40,
      "rank": 1,
      "isBestOption": true
    },
    {
      "id": "clu456def789abc123",
      "amount": 1000000,
      "emi": 24132.87,
      "totalInterest": 447972.20,
      "totalPayment": 1447972.20,
      "rank": 2,
      "isBestOption": false
    }
  ],
  "message": "Simulations compared successfully"
}
```

### 8. Batch Simulate
**POST** `/simulations/batch`

Requires authentication. Process multiple simulations at once.

#### Request Body
```json
{
  "simulations": [
    {
      "loanAmount": 500000,
      "interestRate": 10,
      "tenureYears": 3
    },
    {
      "loanAmount": 1000000,
      "interestRate": 12,
      "tenureYears": 5
    }
  ]
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "successful": [
      {
        "id": "clu123abc456def789",
        "emi": 16133.94,
        "totalInterest": 80821.84,
        "totalPayment": 580821.84
      }
    ],
    "failed": [],
    "summary": {
      "total": 2,
      "successful": 2,
      "failed": 0
    }
  },
  "message": "Batch simulation completed"
}
```

### 9. Export Simulations
**GET** `/simulations/export`

Requires authentication. Export simulations in JSON or CSV format.

#### Query Parameters
- `format`: Export format (json, csv) - default: json

#### Response (JSON)
```json
{
  "success": true,
  "data": [
    {
      "id": "clu123abc456def789",
      "amount": 1000000,
      "emi": 22472.44,
      "totalInterest": 348346.40,
      "totalPayment": 1348346.40,
      "createdAt": "2024-03-10T12:00:00.000Z"
    }
  ],
  "message": "Simulations exported successfully"
}
```

#### Response (CSV)
Content-Type: `text/csv`
Content-Disposition: `attachment; filename="loan_simulations.csv"`

### 10. Health Check
**GET** `/health`

Public endpoint to check loan service health.

#### Response
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "loan-calculator",
    "testCalculation": {
      "emi": 22472.44,
      "totalInterest": 348346.40,
      "totalPayment": 1348346.40
    },
    "performance": {
      "processingTime": "12ms",
      "targetTime": "200ms",
      "isUnderTarget": true
    },
    "timestamp": "2024-03-10T12:00:00.000Z"
  },
  "message": "Loan service is healthy"
}
```

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "VALIDATION_ERROR"
  },
  "timestamp": "2024-03-10T12:00:00.000Z"
}
```

### Common Error Codes

#### Validation Errors (400)
- `VALIDATION_ERROR`: Input validation failed
- `INVALID_INPUT`: Invalid input format
- `OUT_OF_RANGE`: Input value out of allowed range

#### Authentication Errors (401)
- `AUTHENTICATION_REQUIRED`: JWT token required
- `INVALID_TOKEN`: Invalid or expired token

#### Authorization Errors (403)
- `ACCESS_DENIED`: Insufficient permissions
- `ADMIN_REQUIRED`: Admin access required

#### Not Found Errors (404)
- `SIMULATION_NOT_FOUND`: Simulation not found
- `USER_NOT_FOUND`: User not found

#### Server Errors (500)
- `CALCULATION_ERROR`: EMI calculation failed
- `DATABASE_ERROR`: Database operation failed

## Performance

### Target Response Times
- **EMI Calculation**: < 50ms
- **Database Operations**: < 100ms
- **Batch Processing**: < 500ms per 10 simulations
- **Export Operations**: < 1s for up to 1000 records

### Optimization Features
- Input validation with early returns
- Efficient EMI calculation algorithm
- Database connection pooling
- Response caching for frequently accessed data
- Pagination for large datasets

## Security

### Input Validation
- All inputs validated using Zod schemas
- SQL injection prevention with Prisma ORM
- XSS protection with output sanitization

### Rate Limiting
- General rate limiting: 100 requests/15 minutes
- Strict rate limiting: 5 requests/15 minutes for EMI calculation
- User-based rate limiting for authenticated endpoints

### Data Protection
- User data isolation (users can only access their own simulations)
- Secure password hashing for user authentication
- HTTPS encryption for all API communications

## Integration Examples

### JavaScript/Node.js
```javascript
const response = await fetch('/api/v1/loan/simulate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    loanAmount: 1000000,
    interestRate: 12.5,
    tenureYears: 5
  })
});

const result = await response.json();
console.log('EMI:', result.data.emi);
```

### Python
```python
import requests

response = requests.post('/api/v1/loan/simulate', json={
    'loanAmount': 1000000,
    'interestRate': 12.5,
    'tenureYears': 5
})

result = response.json()
print('EMI:', result['data']['emi'])
```

### cURL
```bash
curl -X POST http://localhost:3001/api/v1/loan/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "loanAmount": 1000000,
    "interestRate": 12.5,
    "tenureYears": 5
  }'
```

## Testing

### Unit Testing
```javascript
// Test EMI calculation
const { calculateLoanEMI } = require('./utils/loanCalculator');

const result = calculateLoanEMI({
  loanAmount: 1000000,
  interestRate: 12,
  tenureYears: 5
});

console.assert(result.emi > 0, 'EMI should be positive');
console.assert(result.totalInterest > 0, 'Total interest should be positive');
```

### API Testing
```javascript
// Test API endpoint
const response = await fetch('/api/v1/loan/simulate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    loanAmount: 1000000,
    interestRate: 12,
    tenureYears: 5
  })
});

const result = await response.json();
console.assert(result.success === true, 'API call should succeed');
```

## SDKs and Libraries

### JavaScript SDK
```javascript
import { FinSathiAPI } from '@finsathi/sdk';

const api = new FinSathiAPI({
  baseURL: 'https://api.finsathi.ai/v1',
  apiKey: 'your-api-key'
});

const result = await api.loan.simulate({
  loanAmount: 1000000,
  interestRate: 12.5,
  tenureYears: 5
});
```

### Python SDK
```python
from finsathi_api import FinSathiAPI

api = FinSathiAPI(
    base_url='https://api.finsathi.ai/v1',
    api_key='your-api-key'
)

result = api.loan.simulate(
    loan_amount=1000000,
    interest_rate=12.5,
    tenure_years=5
)
```

## Monitoring

### Metrics to Track
- API response times
- Error rates by endpoint
- User simulation patterns
- Popular loan configurations
- Database query performance

### Logging
- All API requests logged with user context
- Error details with stack traces
- Performance metrics for optimization
- Security events and violations

## Support

### Documentation
- Complete API documentation
- Integration guides and examples
- SDK documentation for multiple languages
- Troubleshooting guide

### Contact
- Email: api-support@finsathi.ai
- Documentation: https://docs.finsathi.ai
- Status Page: https://status.finsathi.ai

---

This API provides a comprehensive loan simulation solution with performance optimization, security features, and extensive functionality for the FinSathi AI platform.
