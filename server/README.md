# FinSathi AI Backend API

A scalable, production-ready backend API for FinSathi AI - Nepal's financial decision support platform for retail investors and loan seekers.

## 🏗️ Architecture

This backend follows a clean, layered architecture pattern:

```
src/
├── routes/          # API endpoints and routing
├── controllers/     # Request handling and response formatting
├── services/        # Business logic and data processing
├── repositories/    # Database access layer
├── middleware/      # Authentication, validation, rate limiting
├── utils/           # Helper functions and utilities
├── app.js           # Express app configuration
└── server.js        # Server startup and initialization
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis (optional, for caching)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd finsathi/server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run database migrations
   npm run db:migrate
   
   # (Optional) Seed the database
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

## 📊 Database Schema

The application uses PostgreSQL with Prisma ORM. Key models include:

- **Users**: User accounts and authentication
- **Companies**: Nepal stock exchange companies
- **Financial Reports**: Company financial data
- **Loans**: Loan simulations and applications
- **AI Reports**: AI-generated company analysis
- **Subscriptions**: User subscription management

## 🔐 Authentication

The API uses JWT-based authentication with refresh tokens:

### Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Protected Requests
```bash
curl -X GET http://localhost:3001/api/v1/auth/profile \
  -H "Authorization: Bearer <access-token>"
```

## 📚 API Documentation

### Health Checks

- `GET /health` - Basic health check
- `GET /health/database` - Database health check
- `GET /health/resources` - System resource check
- `GET /health/detailed` - Comprehensive health check

### Authentication

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `GET /api/v1/auth/profile` - Get user profile
- `PUT /api/v1/auth/profile` - Update user profile
- `POST /api/v1/auth/logout` - User logout

### Companies

- `GET /api/v1/companies` - List companies
- `GET /api/v1/companies/search` - Search companies
- `GET /api/v1/companies/:id` - Get company details
- `GET /api/v1/companies/symbol/:symbol` - Get company by symbol
- `GET /api/v1/companies/trending` - Get trending companies

### Loans

- `POST /api/v1/loans/simulate` - Simulate loan EMI
- `POST /api/v1/loans` - Create loan application
- `GET /api/v1/loans` - Get user loans
- `GET /api/v1/loans/:id` - Get loan details

### Reports

- `POST /api/v1/reports/generate` - Generate AI report
- `GET /api/v1/reports` - List reports
- `GET /api/v1/reports/:id` - Get report details
- `GET /api/v1/reports/:id/export` - Export report

### Subscriptions

- `GET /api/v1/subscriptions/current` - Get current subscription
- `POST /api/v1/subscriptions` - Create subscription
- `PUT /api/v1/subscriptions/:id` - Update subscription
- `POST /api/v1/subscriptions/:id/cancel` - Cancel subscription

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run dev:server       # Start server only
npm run dev:web          # Start web only

# Building
npm run build            # Build all packages
npm run build:server     # Build server only
npm run build:web        # Build web only

# Production
npm run start            # Start production server
npm run start:server     # Start server only
npm run start:web        # Start web only

# Database
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run migrations
npm run db:push          # Push schema to database
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed database

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix          # Fix ESLint errors
npm run test             # Run tests
npm run test:watch       # Run tests in watch mode
```

### Database Operations

```bash
# Create a new migration
npx prisma migrate dev --name <migration-name>

# Reset database
npx prisma migrate reset

# View database
npx prisma studio
```

### Environment Variables

Key environment variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/finsathi_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Server
NODE_ENV="development"
PORT=3001
BASE_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

## 🔧 Configuration

### Rate Limiting

The API implements rate limiting at multiple levels:

- **General**: 100 requests per 15 minutes
- **Authentication**: 10 requests per 15 minutes
- **Strict**: 5 requests per 15 minutes (sensitive endpoints)

### Subscription Plans

- **FREE**: 5 reports/month, 1,000 API calls
- **BASIC**: 50 reports/month, 10,000 API calls
- **PRO**: Unlimited reports, 100,000 API calls
- **ENTERPRISE**: Unlimited everything, priority support

### Security Features

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- Input sanitization and validation
- Rate limiting and DDoS protection
- CORS configuration
- Security headers with Helmet

## 📈 Performance

### Caching

The application uses Redis for caching:

- **API Responses**: 1 hour TTL
- **User Sessions**: 30 minutes TTL
- **Database Queries**: 15 minutes TTL

### Database Optimization

- Connection pooling
- Query optimization
- Indexing strategy
- Pagination for large datasets

### Monitoring

- Structured logging with Pino
- Health check endpoints
- Performance metrics
- Error tracking

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── e2e/           # End-to-end tests
└── fixtures/      # Test data
```

## 🚀 Deployment

### Production Setup

1. **Environment Setup**
   ```bash
   export NODE_ENV=production
   export DATABASE_URL="your-production-db-url"
   export JWT_SECRET="your-production-jwt-secret"
   ```

2. **Database Migration**
   ```bash
   npm run db:migrate
   ```

3. **Build Application**
   ```bash
   npm run build
   ```

4. **Start Server**
   ```bash
   npm start
   ```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### Monitoring

- **Health Checks**: `/health`, `/health/database`, `/health/resources`
- **Metrics**: Custom metrics endpoint
- **Logging**: Structured JSON logs
- **Alerts**: Error rate and performance alerts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Style

- Use ESLint and Prettier
- Follow TypeScript best practices
- Write meaningful commit messages
- Add documentation for new features

## 📝 API Examples

### Generate AI Report

```bash
curl -X POST http://localhost:3001/api/v1/reports/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "company-id",
    "year": 2023,
    "template": "RETAIL_INVESTOR"
  }'
```

### Simulate Loan

```bash
curl -X POST http://localhost:3001/api/v1/loans/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "principal": 1000000,
    "annualRate": 12,
    "tenureMonths": 60
  }'
```

### Search Companies

```bash
curl -X GET "http://localhost:3001/api/v1/companies/search?q=Nabil&page=1&limit=10"
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check DATABASE_URL
   - Ensure PostgreSQL is running
   - Verify credentials

2. **JWT Token Error**
   - Check JWT_SECRET
   - Verify token format
   - Check token expiration

3. **Rate Limit Error**
   - Wait for rate limit window to reset
   - Check subscription limits
   - Verify API key

### Debug Mode

```bash
DEBUG=finsathi:* npm run dev
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Email: support@finsathi.ai
- Documentation: [docs.finsathi.ai](https://docs.finsathi.ai)
- Issues: [GitHub Issues](https://github.com/finsathi/backend/issues)

---

Built with ❤️ for Nepal's financial community
