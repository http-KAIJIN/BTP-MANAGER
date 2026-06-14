import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

type AuthResponseBody = {
  accessToken: string;
  refreshToken: string;
  user: {
    email: string;
    roles: string[];
    permissions: string[];
  };
};

type CurrentUserBody = {
  email: string;
  permissions: string[];
};

type RoleBody = { code: string };
type PermissionBody = { code: string };

describe('Authentication and RBAC (e2e)', () => {
  let app: INestApplication<App>;
  let adminAccessToken: string;
  let adminRefreshToken: string;

  const adminEmail = 'admin@btp-manager.local';
  const adminPassword = 'Admin@123456';

  beforeAll(async () => {
    process.env.DATABASE_URL ??=
      'postgresql://btp_manager:btp_manager_password@localhost:55432/btp_manager';
    process.env.JWT_ACCESS_SECRET ??=
      'test-access-secret-at-least-32-characters';
    process.env.JWT_REFRESH_SECRET ??=
      'test-refresh-secret-at-least-32-characters';
    process.env.JWT_ACCESS_TTL ??= '15m';
    process.env.JWT_REFRESH_TTL ??= '7d';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  it('exposes public health endpoint', () => {
    return request(app.getHttpServer())
      .get('/api/v1')
      .expect(200)
      .expect('Hello World!');
  });

  it('logs in default administrator', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(201);

    const body = response.body as AuthResponseBody;
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    expect(body.user.email).toBe(adminEmail);
    expect(body.user.roles).toContain('administrator');
    expect(body.user.permissions).toContain('admin.users.manage');

    adminAccessToken = body.accessToken;
    adminRefreshToken = body.refreshToken;
  });

  it('returns current user with JWT access token', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(200);

    const body = response.body as CurrentUserBody;
    expect(body.email).toBe(adminEmail);
    expect(body.permissions).toContain('admin.roles.manage');
  });

  it('refreshes access and refresh tokens', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: adminRefreshToken })
      .expect(201);

    const body = response.body as AuthResponseBody;
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    adminAccessToken = body.accessToken;
    adminRefreshToken = body.refreshToken;
  });

  it('allows admin to read roles and permissions', async () => {
    const roles = await request(app.getHttpServer())
      .get('/api/v1/roles')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(200);

    const permissions = await request(app.getHttpServer())
      .get('/api/v1/permissions')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(200);

    const roleBody = roles.body as RoleBody[];
    const permissionBody = permissions.body as PermissionBody[];
    expect(roleBody.some((role) => role.code === 'administrator')).toBe(true);
    expect(
      permissionBody.some(
        (permission) => permission.code === 'admin.users.manage',
      ),
    ).toBe(true);
  });

  it('enforces RBAC for viewer users', async () => {
    const viewerEmail = `viewer-${Date.now()}@btp-manager.local`;
    const viewerPassword = 'Viewer@123456';

    await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        fullName: 'Viewer Test User',
        email: viewerEmail,
        password: viewerPassword,
        roleCodes: ['viewer'],
      })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: viewerEmail, password: viewerPassword })
      .expect(201);

    const viewerLoginBody = loginResponse.body as AuthResponseBody;

    await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${viewerLoginBody.accessToken}`)
      .expect(403);
  });

  afterAll(async () => {
    await app.close();
  });
});
