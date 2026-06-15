# BTP Manager — Release Notes

## Project Overview

BTP Manager is a comprehensive Enterprise Resource Planning (ERP) web application designed for construction project management in Morocco. It enables businesses to track projects, manage financial commitments, process payments, log expenses, and oversee construction phases — all in one platform with a premium bilingual UI (Arabic/French).

## Implemented Modules

- **Dashboard** — Executive summary with KPIs, recent payments, outstanding commitments
- **Companies** — Manage internal and partner companies (CRUD with soft-delete)
- **Projects** — Full project lifecycle (DRAFT → ACTIVE → COMPLETED) with ownership tracking
- **Suppliers** — Supplier directory with financial summaries
- **Intervenants** — Subcontractor/tradesperson management
- **Commitments** — Financial commitments with supplier/intervenant beneficiary types
- **Payments** — Payment recording (Cash/Cheque/Bank Transfer) against commitments
- **Expenses** — Operational expense tracking with categories
- **Clients** — Client management with sales history
- **Properties** — Real estate property inventory (Appartement/Local Commercial/Bureau/Entrepot)
- **Sales** — Real estate sales pipeline with payment tracking
- **Construction** — Phase-based construction progress tracking
- **Reports** — Project, supplier, and intervenant financial reports with CSV export
- **Documents** — File uploads and management per project
- **Admin** — User, role, and permission management
- **Authentication** — JWT-based login with refresh tokens and role-based access control

## Tech Stack

### Backend
- **Runtime:** Node.js 24 (Alpine)
- **Framework:** NestJS 11
- **Database:** PostgreSQL 17 with Prisma ORM 7.8
- **Authentication:** Passport.js + JWT + Argon2 password hashing
- **Validation:** class-validator + class-transformer

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui components
- **State:** React hooks (useState/useEffect)
- **RTL:** Full Arabic right-to-left support

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **Production Build:** Multi-stage Docker builds

## Installation Instructions

### Prerequisites

- Docker & Docker Compose (recommended)
- Node.js 24+ (for local development)
- PostgreSQL 17 (for local development)

### Local Development

```bash
# Clone the repository
git clone https://github.com/http-KAIJIN/BTP-MANAGER.git
cd btp-manager

# Install dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Set up environment
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
cd backend
npx prisma migrate dev
npx prisma db seed
cd ..

# Start development servers
cd backend && npm run start:dev &
cd frontend && npm run dev &
```

## Docker Startup Instructions

```bash
# Build and start all services
docker compose up -d --build

# Verify containers are running
docker ps

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001/api/v1
```

## Default Credentials

| Role          | Email                        | Password     |
|---------------|------------------------------|--------------|
| Administrator | admin@btp-manager.local      | Admin@123456 |

The administrator role has full system access. Additional roles (Project Manager, Accountant, Viewer) can be created via the Admin panel.

## Production Recommendations

1. **Environment Variables:** Configure `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET` with strong, unique values
2. **Database Backups:** Schedule regular PostgreSQL backups
3. **SSL/TLS:** Use a reverse proxy (Nginx/Caddy) with HTTPS termination
4. **Secrets Management:** Rotate JWT secrets periodically
5. **Monitoring:** Implement health checks and logging aggregation
6. **Scaling:** Use container orchestration (Docker Swarm/Kubernetes) for production deployments

## Backup Recommendations

- Schedule daily PostgreSQL dumps: `pg_dump -U btp_manager btp_manager > backup_$(date +%Y%m%d).sql`
- Store backups in a separate, geographically distinct location
- Test restoration procedures regularly
- Keep at least 30 days of backups

## Version

**v1.0.0**

Built on Next.js 16 + NestJS 11 with PostgreSQL 17.
