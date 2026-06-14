# Authentication and RBAC

Phase 3B implements production-ready NestJS authentication and authorization backed by Prisma and PostgreSQL.

## Authentication

- Passwords are hashed with Argon2.
- Access tokens use JWT bearer authentication.
- Refresh tokens are JWTs stored as Argon2 hashes in `users.refresh_token_hash`.
- Refresh token rotation is enabled on every refresh.
- Logout revokes the active refresh token by clearing its stored hash.
- Password change clears active refresh tokens.

## Default Administrator

Seed creates the default administrator account:

- Email: `admin@btp-manager.local`
- Password: `Admin@123456`

These values can be overridden with:

- `DEFAULT_ADMIN_EMAIL`
- `DEFAULT_ADMIN_PASSWORD`
- `DEFAULT_ADMIN_NAME`

## Implemented Endpoints

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/change-password`
- `GET /api/v1/users`
- `POST /api/v1/users`
- `PATCH /api/v1/users/:id`
- `DELETE /api/v1/users/:id`
- `GET /api/v1/roles`
- `GET /api/v1/permissions`

## Authorization

Global guards are registered in this order:

1. `JwtAuthGuard`
2. `RolesGuard`
3. `PermissionsGuard`

Decorators:

- `@Public()` bypasses auth for public endpoints.
- `@CurrentUser()` injects the authenticated user payload.
- `@Roles()` requires one of the listed role codes.
- `@Permissions()` requires all listed permission codes.

## Swagger

Swagger is available at:

`/api/docs`

Bearer authentication is configured in the OpenAPI document.
