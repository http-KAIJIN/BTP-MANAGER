# Product Scope

BTP Manager is a local-first personal ERP for construction and real estate management.

It is not a SaaS platform and it is not designed for thousands of users. The application is optimized for daily use by an owner or a small construction business on a local PC, local server, or simple Docker deployment.

## Primary Goal

Provide immediate daily project-management value:

- Create and track projects.
- Register suppliers.
- Register subcontractors and intervenants.
- Create commitments.
- Record payments.
- Record expenses.
- Instantly see financial totals and remaining balances.

## Architecture Principles

Keep:

- PostgreSQL
- Prisma
- NestJS
- Next.js
- Authentication
- Basic RBAC
- Docker

Avoid:

- Multi-tenant architecture
- Microservices
- Message queues
- Distributed systems
- Complex event systems
- Advanced cloud infrastructure
- Heavy monitoring stacks
- Enterprise workflow engines

## Priority Modules

1. Projects
2. Suppliers
3. Intervenants
4. Commitments
5. Payments
6. Expenses
7. Dashboard

## Daily Business Questions

The application must answer quickly:

- What are my total commitments?
- How much have I paid?
- What remains to be paid?
- What are my total expenses?
- Is the project profitable?
- Which supplier or subcontractor still has a balance?

## Product Decision Rule

Before implementing any feature, ask:

Does this feature provide immediate value for daily project management?

If the answer is no, postpone it.

## Current Implementation Direction

The next priority is the financial core:

- Commitments
- Payments
- Expenses
- Financial calculations
- Dashboard summaries

The architecture should stay clean, but practical and simple enough to maintain locally.
