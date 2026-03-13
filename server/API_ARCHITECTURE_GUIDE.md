# FinSathi AI API Architecture Guide

## Overview
This document outlines the modular Express API architecture implemented for FinSathi AI, designed for scalability, maintainability, and production readiness.

## Architecture Principles

### 1. Separation of Concerns
- **Controllers**: Handle HTTP requests/responses
- **Services**: Business logic and data processing
- **Repositories**: Database operations
- **Validators**: Input validation and sanitization
- **Middleware**: Cross-cutting concerns (auth, logging, etc.)

### 2. Modular Design
Each feature follows the same pattern:
```
feature/
├── feature.controller.ts
├── feature.service.ts
├── feature.repository.ts
├── feature.validator.ts
└── feature.routes.ts
```

### 3. API Versioning
All routes are prefixed with `/api/v1` for future versioning support.

## Folder Structure

```
src/
├── controllers/          # HTTP request handlers
│   ├── loan.controller.ts
│   ├── financialReport.controller.ts
│   └── user.controller.ts
├── services/             # Business logic
│   ├── loan.service.ts
│   ├── financialReport.service.ts
│   └── user.service.ts
├── repositories/         # Database operations
│   ├── loan.repository.ts
│   ├── financialReport.repository.ts
│   └── user.repository.ts
├── validators/           # Input validation
│   ├── loan.validator.ts
│   └── financialReport.validator.ts
├── routes/              # Route definitions
│   ├── loan.routes.ts
│   ├── financialReport.routes.ts
│   └── auth.routes.ts
├── middleware/          # Cross-cutting concerns
│   ├── auth.middleware.ts
│   ├── validation.middleware.ts
│   ├── rateLimiter.middleware.ts
│   ├── errorHandler.ts
│   └── tokenBlacklist.middleware.ts
├── utils/               # Utility functions
│   ├── logger.ts
│   ├── jwt.ts
│   └── password.ts
└── index.ts            # Application entry point
```

## Core Components

### Controllers
**Responsibilities**:
- Handle HTTP requests and responses
- Validate request format
- Call appropriate service methods
- Format response data

**Example**:
```typescript
export class LoanController {
  static createLoan = asyncHandler(async (req: AuthRequest, res: Response) => {
    const loan = await LoanService.createLoan(req.user!.id, req.body);
    res.status(201).json({
      success: true,
      data: loan,
      message: 'Loan application created successfully'
    });
  });
}
```

### Services
**Responsibilities**:
- Implement business logic
- Coordinate between repositories
- Data transformation and validation
- Error handling and logging

**Example**:
```typescript
export class LoanService {
  static async createLoan(userId: string, loanData: CreateLoanData): Promise<Loan> {
    try {
      logger.info({ userId, action: 'create_loan', data: loanData });
      
      const monthlyPayment = this.calculateEMI(
        loanData.principal,
        loanData.interestRate,
        loanData.tenure
      );

      const loan = await LoanRepository.create({
        userId,
        ...loanData,
        emi: monthlyPayment,
        totalPayment: monthlyPayment * loanData.tenure
      });

      return loan;
    } catch (error) {
      logger.error({ error, action: 'create_loan_failed' });
      throw createError('Failed to create loan application', 500);
    }
  }
}
```

### Repositories
**Responsibilities**:
- Database CRUD operations
- Query optimization
- Data mapping and relationships
- Transaction handling

**Example**:
```typescript
export class LoanRepository {
  static async create(loanData: CreateLoanData): Promise<Loan> {
    return this.prisma.loanSimulation.create({
      data: loanData,
      include: {
        user: { select: { id: true, email: true } }
      }
    });
  }

  static async findById(loanId: string, userId: string): Promise<Loan | null> {
    return this.prisma.loanSimulation.findFirst({
      where: { id: loanId, userId },
      include: {
        user: { select: { id: true, email: true } }
      }
    });
  }
}
```

### Validators
**Responsibilities**:
- Input validation using Zod schemas
- Data type checking and conversion
- Custom validation rules
- Error message formatting

**Example**:
```typescript
export const createLoanSchema = z.object({
  principal: z.number()
    .positive('Principal amount must be positive')
    .min(1000, 'Minimum loan amount is NPR 1,000')
    .max(10000000, 'Maximum loan amount is NPR 10,000,000'),
  interestRate: z.number()
    .positive('Interest rate must be positive')
    .min(1, 'Interest rate must be at least 1%')
    .max(30, 'Interest rate cannot exceed 30%'),
  tenure: z.number()
    .int('Tenure must be in months')
    .positive('Tenure must be positive')
    .min(6, 'Minimum tenure is 6 months')
    .max(360, 'Maximum tenure is 360 months (30 years)'),
  type: z.nativeEnum(LoanType)
});
```

### Middleware Stack

#### Global Middleware (Applied to all routes)
1. **Helmet** - Security headers
2. **CORS** - Cross-origin resource sharing
3. **Compression** - Response compression
4. **Morgan** - HTTP request logging
5. **Rate Limiting** - DDoS protection
6. **JSON Parser** - Request body parsing

#### Route-Specific Middleware
1. **Token Blacklist Check** - `/api/v1/*`
2. **Authentication** - Protected routes
3. **Validation** - Input validation
4. **Rate Limiting** - Endpoint-specific limits

## API Endpoints

### Authentication Routes
```
POST /api/v1/auth/register     - User registration
POST /api/v1/auth/login        - User login
POST /api/v1/auth/refresh      - Token refresh
GET  /api/v1/auth/me           - Get user profile
POST /api/v1/auth/logout       - User logout
```

### Loan Routes
```
POST /api/v1/loans              - Create loan application
GET  /api/v1/loans              - Get user's loans
GET  /api/v1/loans/:id          - Get specific loan
PUT  /api/v1/loans/:id          - Update loan
DELETE /api/v1/loans/:id       - Delete loan
POST /api/v1/loans/simulate    - Loan simulation
GET  /api/v1/loans/statistics   - Loan statistics
```

### Financial Report Routes
```
POST /api/v1/reports            - Create financial report
GET  /api/v1/reports            - Get user's reports
GET  /api/v1/reports/:id        - Get specific report
PUT  /api/v1/reports/:id        - Update report
DELETE /api/v1/reports/:id     - Delete report
POST /api/v1/reports/:id/parse  - Parse report content
GET  /api/v1/reports/analytics  - Report analytics
POST /api/v1/reports/upload    - Upload report file
```

## Error Handling

### Error Response Format
All API errors follow this consistent format:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": [] // For validation errors
}
```

### Error Types
1. **Validation Errors** (400) - Invalid input
2. **Authentication Errors** (401) - Invalid/missing tokens
3. **Authorization Errors** (403) - Insufficient permissions
4. **Not Found Errors** (404) - Resource doesn't exist
5. **Rate Limit Errors** (429) - Too many requests
6. **Server Errors** (500) - Internal server issues

## Logging

### Pino Logger Configuration
```typescript
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname'
    }
  }
});
```

### Log Levels
- **info**: General information
- **warn**: Warning messages
- **error**: Error messages
- **debug**: Debug information (development only)

## Rate Limiting Strategy

### Limits by Route Type
- **General API**: 100 requests/15 minutes
- **Auth Endpoints**: 5 requests/15 minutes
- **Login**: 3 attempts/15 minutes
- **Registration**: 3 attempts/hour
- **Token Refresh**: 10 attempts/15 minutes
- **Free Tier**: 50 requests/15 minutes
- **PRO Tier**: 1000 requests/15 minutes

## Security Features

### Authentication
- JWT tokens with 15-minute expiry
- Refresh tokens with 7-day expiry
- Token blacklisting support
- Password hashing with bcrypt (12 rounds)

### Input Validation
- Zod schema validation
- SQL injection prevention
- XSS protection
- File upload validation

### Security Headers
- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Request size limits

## Database Integration

### Prisma ORM
- Type-safe database access
- Automatic migrations
- Connection pooling
- Query optimization

### Repository Pattern
- Abstract database operations
- Centralized query logic
- Transaction support
- Relationship handling

## Performance Optimization

### Caching Strategy
- Redis for session storage
- Application-level caching
- Database query optimization
- Response compression

### Pagination
- Cursor-based pagination for large datasets
- Configurable page sizes
- Metadata for navigation

## Development Workflow

### Environment Setup
1. Install dependencies: `npm install`
2. Set up environment variables
3. Run database migrations: `npm run db:migrate`
4. Seed database: `npm run db:seed`
5. Start development server: `npm run dev`

### Testing Strategy
- Unit tests for services and repositories
- Integration tests for API endpoints
- Load testing for performance
- Security testing for vulnerabilities

### Code Quality
- ESLint for code linting
- TypeScript for type safety
- Prettier for code formatting
- Pre-commit hooks for quality checks

## Production Deployment

### Environment Variables
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
REDIS_URL=redis://...
LOG_LEVEL=info
FRONTEND_URL=https://yourdomain.com
```

### Docker Support
- Multi-stage Dockerfile
- Environment-specific configurations
- Health checks
- Volume mounting for logs

### Monitoring
- Structured logging with Pino
- Health check endpoints
- Performance metrics
- Error tracking

## Best Practices

### Code Organization
- Follow the established folder structure
- Use consistent naming conventions
- Keep files focused and small
- Document complex logic

### Error Handling
- Use consistent error formats
- Log errors with context
- Provide meaningful error messages
- Handle edge cases gracefully

### Security
- Never expose sensitive data
- Validate all inputs
- Use parameterized queries
- Implement proper authentication

### Performance
- Optimize database queries
- Use appropriate caching
- Monitor response times
- Scale horizontally

This modular architecture provides a solid foundation for the FinSathi AI platform, enabling easy maintenance, testing, and future feature development.
