# Core CRUD Modules

Phase 4A implements the first business CRUD modules for BTP Manager.

## Implemented Modules

- Companies
- Projects
- Suppliers
- Intervenants

## Common Behavior

All modules use:

- NestJS controllers, services and DTOs.
- PrismaService for PostgreSQL access.
- JWT authentication through global guards.
- RBAC through `@Permissions()` decorators.
- DTO validation with `class-validator`.
- Swagger metadata through `@ApiTags()` and `@ApiBearerAuth()`.
- Pagination with `page` and `limit`.
- Search and filters.
- Sorting with `sortBy` and `sortOrder`.
- Soft delete through `deleted_at`.
- Restore by clearing `deleted_at`.

Normal list and detail endpoints exclude archived/deleted records by default.

## Endpoints

### Companies

- `GET /api/v1/companies`
- `POST /api/v1/companies`
- `GET /api/v1/companies/:id`
- `PATCH /api/v1/companies/:id`
- `DELETE /api/v1/companies/:id`
- `POST /api/v1/companies/:id/restore`

### Projects

- `GET /api/v1/projects`
- `POST /api/v1/projects`
- `GET /api/v1/projects/:id`
- `PATCH /api/v1/projects/:id`
- `DELETE /api/v1/projects/:id`
- `POST /api/v1/projects/:id/restore`

### Suppliers

- `GET /api/v1/suppliers`
- `POST /api/v1/suppliers`
- `GET /api/v1/suppliers/:id`
- `PATCH /api/v1/suppliers/:id`
- `DELETE /api/v1/suppliers/:id`
- `POST /api/v1/suppliers/:id/restore`

### Intervenants

- `GET /api/v1/intervenants`
- `POST /api/v1/intervenants`
- `GET /api/v1/intervenants/:id`
- `PATCH /api/v1/intervenants/:id`
- `DELETE /api/v1/intervenants/:id`
- `POST /api/v1/intervenants/:id/restore`

## Permissions

Companies:

- `companies.read`
- `companies.create`
- `companies.update`
- `companies.archive`

Projects:

- `projects.read`
- `projects.create`
- `projects.update`
- `projects.archive`

Suppliers:

- `suppliers.read`
- `suppliers.create`
- `suppliers.update`
- `suppliers.archive`

Intervenants:

- `intervenants.read`
- `intervenants.create`
- `intervenants.update`
- `intervenants.archive`

## Project Business Rules

- Project name is required.
- City is required.
- Start date is required.
- Expected end date cannot be before start date.
- Ownership type must be `internal_company` or `external_client`.
- Internal company projects require `ownerCompanyId`.
- External client projects require `externalClientName`.
- Executing company is required.
- Referenced companies must exist and must not be soft deleted.
