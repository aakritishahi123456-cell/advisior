# FinSathi AI

FinSathi AI is a Nepal-focused financial decision support system that provides:

- Loan simulations
- Financial report parsing
- AI analysis reports
- User dashboards
- Freemium subscription gating

## Architecture

This project follows a modular monolith pattern for MVP speed with the following structure:

```
finsathi-ai/
├── apps/
│   └── web/           # Next.js frontend
├── server/            # Node.js backend
├── packages/
│   └── shared-types/  # Shared TypeScript types
└── infra/            # Docker and infrastructure
```

## Tech Stack

### Backend
- Node.js
- Express
- Prisma ORM
- Zod
- JWT
- bcrypt
- BullMQ
- Redis

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Zustand
- Axios
- React Hook Form
- Tailwind CSS

### Infrastructure
- PostgreSQL
- Redis
- Docker
- Nginx

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run database migrations: `npm run db:migrate`
5. Start development servers: `npm run dev`

## Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/finsathi
JWT_SECRET=your-jwt-secret
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your-openai-api-key
NODE_ENV=development
PORT=3001
```

## Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build all packages
- `npm run start` - Start production servers
- `npm run lint` - Lint all packages
- `npm run test` - Run all tests
