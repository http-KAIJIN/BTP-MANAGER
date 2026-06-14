# BTP Manager

Local-first personal ERP for construction and real estate management. Designed for daily use by an owner-operated construction business.

## Quick Start

### One-command startup (Docker)

```bash
./start.sh
```

This will:
1. Create `.env` from `.env.example` if missing
2. Build and start all Docker containers
3. Run database migrations automatically
4. Seed the database with default admin, roles, and permissions

### One-command startup (Development)

```bash
./start.sh dev
```

Requires Node.js 24 and PostgreSQL running locally.

### Access

| Service   | URL                           |
|-----------|-------------------------------|
| Frontend  | http://localhost:3000         |
| Backend   | http://localhost:3001         |
| API Docs  | http://localhost:3001/api/docs |

### Default login

```
Email:    admin@btp-manager.local
Password: Admin@123456
```

## Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend:** NestJS 11, TypeScript, Prisma 7
- **Database:** PostgreSQL 17
- **Auth:** JWT + RBAC (Argon2 password hashing)
- **Deployment:** Docker Compose

## Modules

| Module        | Backend | Frontend | Description                      |
|---------------|---------|----------|----------------------------------|
| Auth / RBAC   | ✅      | ✅       | JWT login, roles, permissions    |
| Dashboard     | ✅      | ✅       | KPIs, recent payments, alerts    |
| Companies     | ✅      | ✅       | Construction companies           |
| Projects      | ✅      | ✅       | Projects with financial summary  |
| Suppliers     | ✅      | ✅       | Material suppliers               |
| Intervenants  | ✅      | ✅       | Subcontractors/tradespeople      |
| Commitments   | ✅      | ✅       | Financial commitments/agreements |
| Payments      | ✅      | ✅       | Payments against commitments     |
| Expenses      | ✅      | ✅       | Categorized project expenses     |

## Documentation

- `docs/database/erd.md` — Database schema and relationships
- `docs/backend/auth-rbac.md` — Authentication and RBAC implementation
- `docs/backend/core-crud.md` — CRUD module patterns and business rules
- `docs/product-scope.md` — Product vision and scope

## Development

```bash
npm install               # Install dependencies
npm run dev               # Start both frontend + backend in watch mode
npm run build             # Build for production
npm run lint              # Lint both workspaces
npm run test              # Run backend tests
```

### Database commands

```bash
npm run prisma:generate --workspace backend   # Generate Prisma client
npm run prisma:migrate --workspace backend    # Run migrations
npm run prisma:seed --workspace backend      # Seed database
```

### Docker

```bash
npm run docker:up         # docker compose up --build
npm run docker:down       # docker compose down
```
