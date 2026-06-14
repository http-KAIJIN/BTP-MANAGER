# BTP Manager

BTP Manager is a local-first personal ERP for construction and real estate management. It is designed for daily use by an owner-operated construction business on a PC, local server, or simple Docker deployment.

The focus is practical business value: projects, suppliers, intervenants, commitments, payments, expenses, financial summaries, and dashboard visibility. It is not a SaaS platform and intentionally avoids enterprise over-engineering.

## Stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: NestJS, TypeScript
- Database: PostgreSQL
- Auth target: JWT + RBAC
- Deployment target: Docker

## Workspace

```text
btp-manager/
├── frontend/   Next.js ERP interface
├── backend/    NestJS API
├── docker-compose.yml
└── .env.example
```

## Local Setup

1. Copy `.env.example` to `.env`.
2. Install dependencies from the root with `npm install`.
3. Run development apps with `npm run dev`.
4. Run Docker services with `npm run docker:up`.

## MVP Modules

- Authentication and RBAC
- Companies
- Projects
- Intervenants
- Suppliers
- Commitments
- Payments
- Expenses
- Construction tracking
- Dashboard
- Reports

## Database

Prisma is configured in `backend/prisma/schema.prisma` with PostgreSQL as the database provider.

Common commands:

- `npm run prisma:generate --workspace backend`
- `npm run prisma:migrate --workspace backend`
- `npm run prisma:seed --workspace backend`
- `npm run prisma:verify --workspace backend`

The MVP ERD is documented in `docs/database/erd.md`.

Authentication and RBAC implementation notes are documented in `docs/backend/auth-rbac.md`.

Core CRUD modules are documented in `docs/backend/core-crud.md`.

Product scope and prioritization rules are documented in `docs/product-scope.md`.
