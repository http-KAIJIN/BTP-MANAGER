import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

type AuthResponseBody = { accessToken: string };
type EntityBody = { id: string; name: string; deletedAt?: string | null };
type PaginatedBody = { data: EntityBody[]; meta: { total: number } };

describe('Core CRUD modules (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let viewerToken: string;

  beforeAll(async () => {
    process.env.DATABASE_URL ??=
      'postgresql://btp_manager:btp_manager_password@localhost:55432/btp_manager';
    process.env.JWT_ACCESS_SECRET ??=
      'test-access-secret-at-least-32-characters';
    process.env.JWT_REFRESH_SECRET ??=
      'test-refresh-secret-at-least-32-characters';

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

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@btp-manager.local', password: 'Admin@123456' })
      .expect(201);
    adminToken = (adminLogin.body as AuthResponseBody).accessToken;

    const viewerEmail = `core-viewer-${Date.now()}@btp-manager.local`;
    await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fullName: 'Core Viewer',
        email: viewerEmail,
        password: 'Viewer@123456',
        roleCodes: ['viewer'],
      })
      .expect(201);
    const viewerLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: viewerEmail, password: 'Viewer@123456' })
      .expect(201);
    viewerToken = (viewerLogin.body as AuthResponseBody).accessToken;
  });

  it('admin can create/list/update/delete/restore companies and viewer is read-only', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/companies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Company ${Date.now()}`,
        ice: `ICE-${Date.now()}`,
        city: 'ignored',
      })
      .expect(400);

    expect(created.body).toBeDefined();

    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/companies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `Company ${Date.now()}`, ice: `ICE-${Date.now()}` })
      .expect(201);
    const company = createResponse.body as EntityBody;

    const list = await request(app.getHttpServer())
      .get('/api/v1/companies?search=Company')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect((list.body as PaginatedBody).meta.total).toBeGreaterThan(0);

    await request(app.getHttpServer())
      .get(`/api/v1/companies/${company.id}`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/companies')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ name: 'Denied Company' })
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/api/v1/companies/${company.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ managerName: 'Manager' })
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/companies/${company.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/api/v1/companies/${company.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
    await request(app.getHttpServer())
      .post(`/api/v1/companies/${company.id}/restore`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
  });

  it('admin can create/list/update/delete/restore suppliers', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/suppliers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `Supplier ${Date.now()}`, category: 'Béton' })
      .expect(201);
    const supplier = response.body as EntityBody;
    await request(app.getHttpServer())
      .get('/api/v1/suppliers?category=Béton')
      .set('Authorization', `Bearer ${viewerToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/v1/suppliers/${supplier.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ phone: '0600000000' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/v1/suppliers/${supplier.id}`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ phone: '0600000001' })
      .expect(403);
    await request(app.getHttpServer())
      .delete(`/api/v1/suppliers/${supplier.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .post(`/api/v1/suppliers/${supplier.id}/restore`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
  });

  it('admin can create/list/update/delete/restore intervenants', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/intervenants')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `Intervenant ${Date.now()}`, trade: 'Ferronnier' })
      .expect(201);
    const intervenant = response.body as EntityBody;
    await request(app.getHttpServer())
      .get('/api/v1/intervenants?trade=Ferronnier')
      .set('Authorization', `Bearer ${viewerToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/v1/intervenants/${intervenant.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ phone: '0600000000' })
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/intervenants/${intervenant.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .post(`/api/v1/intervenants/${intervenant.id}/restore`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
  });

  it('admin can create/list/update/delete/restore projects and invalid ownership rules fail', async () => {
    const companyResponse = await request(app.getHttpServer())
      .post('/api/v1/companies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `Project Owner ${Date.now()}`, ice: `PROJ-${Date.now()}` })
      .expect(201);
    const company = companyResponse.body as EntityBody;

    await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Invalid Project',
        city: 'Casa',
        startDate: '2026-02-01',
        expectedEndDate: '2026-01-01',
        ownershipType: 'internal_company',
        ownerCompanyId: company.id,
        executingCompanyId: company.id,
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Invalid Ownership',
        city: 'Casa',
        startDate: '2026-01-01',
        ownershipType: 'internal_company',
        executingCompanyId: company.id,
      })
      .expect(400);

    const projectResponse = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Project ${Date.now()}`,
        city: 'Casablanca',
        startDate: '2026-01-01',
        expectedEndDate: '2026-12-31',
        ownershipType: 'internal_company',
        ownerCompanyId: company.id,
        executingCompanyId: company.id,
      })
      .expect(201);
    const project = projectResponse.body as EntityBody;

    await request(app.getHttpServer())
      .get('/api/v1/projects?city=Casablanca')
      .set('Authorization', `Bearer ${viewerToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/v1/projects/${project.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ notes: 'Updated' })
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/projects/${project.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .post(`/api/v1/projects/${project.id}/restore`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });
});
