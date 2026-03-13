# FinSathi AI Backend Architecture Guide

## 🏗️ Overview

The FinSathi AI backend follows a clean, layered architecture designed for scalability, maintainability, and testability. This architecture supports the complex requirements of a financial decision support platform while remaining flexible for future growth.

## 📁 Project Structure

```
server/
├── src/
│   ├── routes/              # API Routes Layer
│   │   ├── health.js       # Health check endpoints
│   │   ├── auth.js         # Authentication routes
│   │   ├── company.js      # Company management routes
│   │   ├── loan.js         # Loan simulation routes
│   │   ├── report.js       # AI report routes
│   │   └── subscription.js # Subscription routes
│   ├── controllers/         # Controller Layer
│   │   ├── BaseController.js
│   │   ├── AuthController.js
│   │   ├── CompanyController.js
│   │   ├── LoanController.js
│   │   ├── ReportController.js
│   │   └── SubscriptionController.js
│   ├── services/            # Business Logic Layer
│   │   ├── BaseService.js
│   │   ├── AuthService.js
│   │   ├── CompanyService.js
│   │   ├── LoanService.js
│   │   ├── ReportService.js
│   │   └── SubscriptionService.js
│   ├── repositories/        # Data Access Layer
│   │   ├── BaseRepository.js
│   │   ├── UserRepository.js
│   │   ├── CompanyRepository.js
│   │   ├── LoanRepository.js
│   │   ├── ReportRepository.js
│   │   └── SubscriptionRepository.js
│   ├── middleware/          # Middleware Layer
│   │   ├── auth.js          # Authentication middleware
│   │   ├── validation.js    # Request validation
│   │   ├── rateLimit.js     # Rate limiting
│   │   ├── errorHandler.js  # Error handling
│   │   ├── notFoundHandler.js
│   │   └── requestLogger.js # Request logging
│   ├── utils/               # Utility Functions
│   │   ├── logger.js        # Logging configuration
│   │   ├── response.js      # Response formatting
│   │   ├── constants.js     # Application constants
│   │   └── helpers.js       # Helper functions
│   ├── app.js               # Express app configuration
│   ├── server.js            # Server startup
│   └── index.js             # Entry point
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── migrations/          # Database migrations
│   └── seed.js              # Database seeding
├── logs/                    # Application logs
├── uploads/                 # File uploads
├── tests/                   # Test files
├── .env.example             # Environment variables template
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── README.md                # Documentation
```

## 🏛️ Layer Architecture

### 1. Routes Layer (API Endpoints)
**Purpose**: Define API endpoints and route requests to appropriate controllers.

**Responsibilities**:
- Route definition and organization
- Request validation middleware
- Authentication and authorization
- Rate limiting
- Request/response logging

**Example**:
```javascript
// routes/auth.js
router.post('/login', 
  authLimiter,
  validateLogin,
  authController.login
);
```

### 2. Controller Layer (Request Handling)
**Purpose**: Handle HTTP requests, call services, and format responses.

**Responsibilities**:
- Parse request data
- Call appropriate service methods
- Format API responses
- Handle HTTP-specific logic
- Error handling and status codes

**Example**:
```javascript
// controllers/AuthController.js
login = async (req, res, next) => {
  try {
    const result = await this.authService.login(email, password);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};
```

### 3. Service Layer (Business Logic)
**Purpose**: Implement business logic and coordinate between repositories.

**Responsibilities**:
- Business rule implementation
- Data transformation
- Transaction management
- Cross-repository operations
- Business validation

**Example**:
```javascript
// services/AuthService.js
async login(email, password) {
  const user = await this.userRepository.findByEmail(email);
  const isValid = await comparePassword(password, user.password);
  if (!isValid) throw new Error('Invalid credentials');
  
  const tokens = this.generateTokens(user);
  await this.userRepository.updateLastLogin(user.id);
  return { user: this.sanitizeUser(user), tokens };
}
```

### 4. Repository Layer (Data Access)
**Purpose**: Handle database operations and data persistence.

**Responsibilities**:
- Database queries
- CRUD operations
- Data mapping
- Transaction management
- Connection handling

**Example**:
```javascript
// repositories/UserRepository.js
async findByEmail(email, include = {}) {
  return await this.model.findUnique({
    where: { email },
    include,
  });
}
```

### 5. Middleware Layer (Cross-cutting Concerns)
**Purpose**: Handle cross-cutting concerns like authentication, validation, and logging.

**Components**:
- **Authentication**: JWT token verification
- **Validation**: Request data validation
- **Rate Limiting**: API rate limiting
- **Error Handling**: Centralized error handling
- **Logging**: Request/response logging

## 🔄 Data Flow

### Request Flow
```
Client Request → Routes → Middleware → Controller → Service → Repository → Database
```

### Response Flow
```
Database → Repository → Service → Controller → Routes → Client Response
```

### Example: User Login
1. **Client**: POST `/api/v1/auth/login` with credentials
2. **Routes**: Route to `authController.login`
3. **Middleware**: Apply rate limiting and validation
4. **Controller**: Extract email/password, call `authService.login`
5. **Service**: Find user, verify password, generate tokens
6. **Repository**: Query database for user
7. **Database**: Return user data
8. **Repository**: Return user object
9. **Service**: Generate JWT tokens, return user data
10. **Controller**: Format response with tokens
11. **Routes**: Send response to client

## 🛡️ Security Architecture

### Authentication
- **JWT Tokens**: Access tokens (15 min) + Refresh tokens (30 days)
- **Password Hashing**: bcrypt with 12 rounds
- **Token Rotation**: Refresh token rotation on each use
- **Session Management**: Redis-based session storage

### Authorization
- **Role-Based Access Control**: FREE, BASIC, PRO, ENTERPRISE
- **Subscription-Based Features**: Feature access based on plan
- **Resource-Level Permissions**: Fine-grained access control
- **API Key Management**: For programmatic access

### Security Middleware
```javascript
// Authentication flow
authenticate → authorize → rateLimit → validate → controller
```

## 📊 Database Architecture

### Schema Design
- **Users**: Authentication and profile data
- **Companies**: Nepal stock exchange companies
- **Financial Reports**: Company financial data
- **AI Reports**: Generated analysis reports
- **Loans**: Loan simulations and applications
- **Subscriptions**: User subscription data

### Relationships
```
Users 1:N FinancialReports
Users 1:N AI Reports
Users 1:N Subscriptions
Users 1:N Loans
Companies 1:N FinancialReports
Companies 1:N AI Reports
```

### Indexing Strategy
- **Primary Keys**: All tables have UUID primary keys
- **Foreign Keys**: Indexed for relationship queries
- **Search Fields**: Email, company name, symbol
- **Timestamps**: Created/updated dates for filtering

## 🚀 Performance Architecture

### Caching Strategy
- **Redis**: Response caching, session storage
- **Application Cache**: In-memory for frequently accessed data
- **Database Query Cache**: Prisma query optimization
- **CDN**: Static asset delivery

### Rate Limiting
- **Global**: 100 requests/15 minutes
- **Authentication**: 10 requests/15 minutes
- **Premium Users**: Higher limits based on subscription
- **IP-based**: Per-IP rate limiting

### Database Optimization
- **Connection Pooling**: 20 max connections
- **Query Optimization**: Efficient Prisma queries
- **Pagination**: Cursor-based for large datasets
- **Read Replicas**: For read-heavy operations

## 🔧 Configuration Management

### Environment Variables
```javascript
// Critical variables
DATABASE_URL, JWT_SECRET, NODE_ENV, PORT

// Optional variables
REDIS_URL, SMTP_HOST, STRIPE_KEY
```

### Configuration Layers
1. **Default Values**: Built-in defaults
2. **Environment Variables**: Runtime configuration
3. **Feature Flags**: Enable/disable features
4. **Subscription Limits**: Dynamic limits based on plan

## 📝 Error Handling Architecture

### Error Types
- **Validation Errors**: 400 Bad Request
- **Authentication Errors**: 401 Unauthorized
- **Authorization Errors**: 403 Forbidden
- **Not Found Errors**: 404 Not Found
- **Business Logic Errors**: 422 Unprocessable Entity
- **System Errors**: 500 Internal Server Error

### Error Flow
```
Service Error → Controller → ErrorHandler → Client Response
```

### Error Logging
- **Structured Logging**: JSON format with context
- **Error Levels**: info, warn, error, fatal
- **Context Information**: User ID, IP, endpoint, timestamp
- **Error Tracking**: Sentry integration for production

## 🧪 Testing Architecture

### Test Types
- **Unit Tests**: Individual function testing
- **Integration Tests**: Service layer testing
- **API Tests**: Endpoint testing
- **E2E Tests**: Full application flow testing

### Test Structure
```
tests/
├── unit/           # Service and repository tests
├── integration/    # API integration tests
├── e2e/           # End-to-end tests
└── fixtures/      # Test data and mocks
```

### Testing Tools
- **Jest**: Test runner and assertion library
- **Supertest**: HTTP assertion testing
- **Prisma Test Client**: Database testing
- **Mock Services**: External service mocking

## 📈 Monitoring & Observability

### Logging
- **Structured Logging**: Pino logger
- **Log Levels**: info, warn, error, fatal
- **Context**: User ID, request ID, IP, endpoint
- **Performance**: Response times, memory usage

### Health Checks
- **Basic Health**: Service availability
- **Database Health**: Connection status
- **Resource Health**: Memory, CPU, disk usage
- **Dependency Health**: External service status

### Metrics
- **Application Metrics**: Request count, response times
- **Business Metrics**: User registrations, report generation
- **System Metrics**: Memory, CPU, database connections
- **Error Metrics**: Error rates, error types

## 🔄 Scalability Architecture

### Horizontal Scaling
- **Stateless Design**: Services are stateless
- **Load Balancing**: Multiple server instances
- **Database Scaling**: Read replicas, sharding
- **Cache Distribution**: Redis cluster

### Vertical Scaling
- **Resource Allocation**: CPU, memory optimization
- **Database Optimization**: Query performance
- **Caching Strategy**: Multi-level caching
- **Background Jobs**: BullMQ for async processing

### Microservices Ready
- **Service Boundaries**: Clear service boundaries
- **API Gateway**: Centralized routing
- **Service Discovery**: Dynamic service registration
- **Inter-service Communication**: HTTP/REST or message queues

## 🔮 Future Architecture Considerations

### Microservices Migration
- **Service Extraction**: Gradual service extraction
- **API Gateway**: Centralized routing and authentication
- **Service Mesh**: Inter-service communication
- **Event Sourcing**: Event-driven architecture

### Advanced Features
- **Machine Learning**: AI model integration
- **Real-time Updates**: WebSocket support
- **Advanced Analytics**: Data pipeline integration
- **Multi-tenancy**: Multi-organization support

### Performance Enhancements
- **GraphQL**: Flexible API queries
- **Caching Layers**: Multi-level caching strategy
- **Database Optimization**: Advanced query optimization
- **CDN Integration**: Global content delivery

## 📚 Best Practices

### Code Organization
- **Single Responsibility**: Each class has one responsibility
- **Dependency Injection**: Services depend on abstractions
- **Interface Segregation**: Small, focused interfaces
- **Don't Repeat Yourself**: Reuse common code

### Security Best Practices
- **Principle of Least Privilege**: Minimal required permissions
- **Defense in Depth**: Multiple security layers
- **Input Validation**: Validate all inputs
- **Output Sanitization**: Sanitize all outputs

### Performance Best Practices
- **Lazy Loading**: Load data only when needed
- **Connection Pooling**: Reuse database connections
- **Caching**: Cache frequently accessed data
- **Pagination**: Paginate large result sets

### Testing Best Practices
- **Test Coverage**: Aim for 80%+ coverage
- **Test Isolation**: Tests should not depend on each other
- **Mock External Services**: Don't hit real external APIs
- **Test Data Management**: Use test fixtures and factories

This architecture provides a solid foundation for the FinSathi AI platform while remaining flexible for future growth and changes in requirements.
