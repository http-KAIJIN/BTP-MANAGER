# DELIVERY REPORT — BTP Manager

**Version:** `1.0.0`  
**Delivery Date:** June 15, 2026  
**Repository:** [https://github.com/http-KAIJIN/BTP-MANAGER.git](https://github.com/http-KAIJIN/BTP-MANAGER.git)  
**Branch:** `main`  
**Commit:** `e6f4eb5fd63253a8bc12411d69310c99610dad23`

---

## Project Summary

BTP Manager is a **local-first personal ERP** for construction and real estate management. It is designed for daily use by an owner-operated construction business, covering the full lifecycle from project planning and financial commitments to real-estate sales tracking.

The application runs entirely on the owner's infrastructure (Docker Compose on a local server, VPS, or single machine). No third-party SaaS dependency is required — the database, backend API, and frontend are self-contained within the Docker stack.

---

## Implemented Modules

| Module | Description |
|---|---|
| **Authentication & RBAC** | JWT-based auth with access/refresh tokens, role-based access control, permission management |
| **Dashboard** | Aggregated KPIs, charts (Recharts), revenue/expense trends, quick-access widgets |
| **Companies** | Construction company registry (ICE, address, manager, contact) |
| **Projects** | Full project lifecycle (type, dates, ownership, status, client linking) |
| **Suppliers** | Material supplier management |
| **Intervenants** | Subcontractors / tradespeople directory |
| **Commitments** | Financial commitments to suppliers and intervenants with status tracking |
| **Payments** | Payment processing against commitments (multiple payment modes) |
| **Expenses** | Categorized project expenses linked to suppliers |
| **Construction Phases** | Phase tracking with status, progress, and date management |
| **Documents** | File upload and management per project |
| **Clients** | Real-estate client registry (name, CIN, address) |
| **Properties** | Property/unit catalog (type, surface, price, status) |
| **Sales** | Property sales pipeline with down payment tracking |
| **Sale Payments** | Installment/payment plan tracking for sales |
| **Reports** | PDF reports and data exports |
| **Admin Panel** | User, role, and permission management interface |
| **UI/UX (Phase 7)** | Premium responsive redesign: shadcn/ui components, dark/light theme, mobile drawer, sidebar navigation, topbar, animated theme toggler, UI kit (KPI cards, data tables, charts, status badges, form sections, page headers) |

---

## Technologies Used

### Backend
- **Runtime:** Node.js 24 (Alpine)
- **Framework:** NestJS 11
- **Language:** TypeScript
- **ORM:** Prisma 7 with PostgreSQL adapter
- **Database:** PostgreSQL 17 (Alpine)
- **Auth:** Passport.js + JWT (Argon2 password hashing)
- **Validation:** class-validator + class-transformer
- **API Docs:** Swagger / OpenAPI (`/api/docs`)

### Frontend
- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Component System:** shadcn/ui (Radix UI primitives)
- **Icons:** Lucide React
- **Charts:** Recharts
- **Animations:** Motion (Framer Motion)
- **Theme:** next-themes

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **Base Images:** `node:24-alpine`, `postgres:17-alpine`
- **Orchestration:** Docker Compose with health checks

---

## Setup Instructions

### Prerequisites
- Docker and Docker Compose installed
- Git (to clone the repository)

### Quick Start (Production)

```bash
# 1. Clone the repository
git clone https://github.com/http-KAIJIN/BTP-MANAGER.git
cd BTP-MANAGER

# 2. Run the setup script
./start.sh

# 3. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001/api/v1
# API Docs:   http://localhost:3001/api/docs
```

The `start.sh` script will:
1. Create a `.env` file from `.env.example` (if not present)
2. Build Docker images
3. Start PostgreSQL, backend, and frontend services
4. Run database migrations
5. Seed the database with default data

### Development Mode

```bash
# Requires Node.js 24 + PostgreSQL 17 running locally
./start.sh dev
```

### Manual Docker Compose

```bash
docker compose up -d
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run prisma:seed
```

---

## Default Credentials

| Role | Email | Password |
|---|---|---|
| **Administrator** | `admin@btp-manager.local` | `Admin@123456` |

> **Important:** Change the default password immediately after first login. Update `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in `.env` for production.

---

## Production Recommendations

### Security
1. Change `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` to strong random values
2. Change `POSTGRES_PASSWORD` to a strong password
3. Change `DEFAULT_ADMIN_PASSWORD` after first login
4. Enable HTTPS via a reverse proxy (nginx, Caddy, Traefik)
5. Restrict `CORS_ORIGINS` to the actual frontend domain
6. Consider rate-limiting on auth endpoints

### Performance
1. Configure PostgreSQL `shared_buffers` and `work_mem` based on available RAM
2. Add a CDN for static assets if serving to multiple users
3. Consider database connection pooling (PgBouncer) for higher concurrency

### Monitoring
1. Set up container health checks and restart policies (already configured)
2. Configure log rotation for Docker containers
3. Monitor disk usage for the `uploads` volume (file storage)

### Scaling
- Single-server deployment is the intended architecture
- For multi-user scenarios, scale the backend horizontally behind a load balancer
- The database volume (`postgres-data`) should be backed up regularly

---

## Backup Recommendations

### Database Backup (PostgreSQL)
```bash
# Dump the database
docker compose exec postgres pg_dump -U btp_manager btp_manager > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from dump
cat backup.sql | docker compose exec -T postgres psql -U btp_manager btp_manager
```

### Volume Backup
```bash
# Back up PostgreSQL data volume
docker run --rm -v btp-manager_postgres-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/postgres-data_$(date +%Y%m%d).tar.gz -C /data .

# Back up uploads volume
docker run --rm -v btp-manager_uploads:/data -v $(pwd):/backup alpine \
  tar czf /backup/uploads_$(date +%Y%m%d).tar.gz -C /data .
```

### Recommended Backup Strategy
- **Daily:** Database dump (cron job)
- **Weekly:** Full volume backup (postgres-data + uploads)
- **Monthly:** Off-site copy (cloud storage or external drive)
- **Retention:** Keep 7 daily, 4 weekly, 3 monthly backups

---

## Version Number

**Current version:** `1.0.0`  
**Release phase:** Phase 7 (Production readiness — Premium ERP UI/UX redesign)

---

*Generated automatically on delivery.*
