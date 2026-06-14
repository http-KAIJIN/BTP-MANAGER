import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

type AuthResponseBody = { accessToken: string };
type EntityBody = { id: string; status?: string };
type BalanceBody = {
  agreedAmount: number;
  totalPaid: number;
  remainingAmount: number;
  status: string;
};
type ProjectSummaryBody = {
  totalCommitments: number;
  totalPaid: number;
  totalRemaining: number;
  totalExpenses: number;
};
type PartySummaryBody = {
  totalCommitments: number;
  totalPaid: number;
  totalRemaining: number;
};

describe('Financial core (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;
  let adminToken: string;
  let viewerToken: string;

  beforeAll(async () => {
    process.env.DATABASE_URL ??=
      'postgresql://btp_manager:btp_manager_password@localhost:55432/btp_manager';
    process.env.JWT_ACCESS_SECRET ??=
      'test-access-secret-at-least-32-characters';
    process.env.JWT_REFRESH_SECRET ??=
      'test-refresh-secret-at-least-32-characters';

    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    });

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

    const viewerEmail = `financial-viewer-${Date.now()}@btp-manager.local`;
    await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fullName: 'Financial Viewer',
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

  it('calculates commitment balances, payment statuses, summaries, expenses, and RBAC', async () => {
    const suffix = Date.now();
    const company = (
      await request(app.getHttpServer())
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Finance Company ${suffix}`, ice: `FIN-${suffix}` })
        .expect(201)
    ).body as EntityBody;

    const supplier = (
      await request(app.getHttpServer())
        .post('/api/v1/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Finance Supplier ${suffix}`, category: 'Béton' })
        .expect(201)
    ).body as EntityBody;

    const intervenant = (
      await request(app.getHttpServer())
        .post('/api/v1/intervenants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Finance Intervenant ${suffix}`, trade: 'Ferronnier' })
        .expect(201)
    ).body as EntityBody;

    const project = (
      await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Finance Project ${suffix}`,
          city: 'Casablanca',
          startDate: '2026-01-01',
          ownershipType: 'internal_company',
          ownerCompanyId: company.id,
          executingCompanyId: company.id,
        })
        .expect(201)
    ).body as EntityBody;

    const supplierCommitment = (
      await request(app.getHttpServer())
        .post('/api/v1/commitments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectId: project.id,
          beneficiaryType: 'supplier',
          supplierId: supplier.id,
          description: 'Concrete commitment',
          agreedAmount: 100,
          commitmentDate: '2026-01-02',
        })
        .expect(201)
    ).body as EntityBody;

    await request(app.getHttpServer())
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        projectId: project.id,
        commitmentId: supplierCommitment.id,
        paymentDate: '2026-01-03',
        amount: 10,
        paymentMode: 'cash',
      })
      .expect(403);

    await request(app.getHttpServer())
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        projectId: project.id,
        commitmentId: supplierCommitment.id,
        paymentDate: '2026-01-03',
        amount: 40,
        paymentMode: 'cash',
      })
      .expect(201);

    const partial = (
      await request(app.getHttpServer())
        .get(`/api/v1/commitments/${supplierCommitment.id}/balance`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
    ).body as BalanceBody;
    expect(partial.totalPaid).toBe(40);
    expect(partial.remainingAmount).toBe(60);
    expect(partial.status).toBe('partially_paid');

    const secondPayment = (
      await request(app.getHttpServer())
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectId: project.id,
          commitmentId: supplierCommitment.id,
          paymentDate: '2026-01-04',
          amount: 60,
          paymentMode: 'cheque',
          chequeNumber: 'CH-001',
        })
        .expect(201)
    ).body as EntityBody;

    const paid = (
      await request(app.getHttpServer())
        .get(`/api/v1/commitments/${supplierCommitment.id}/balance`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
    ).body as BalanceBody;
    expect(paid.totalPaid).toBe(100);
    expect(paid.remainingAmount).toBe(0);
    expect(paid.status).toBe('paid');

    await request(app.getHttpServer())
      .patch(`/api/v1/payments/${secondPayment.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 70 })
      .expect(200);

    const overpaid = (
      await request(app.getHttpServer())
        .get(`/api/v1/commitments/${supplierCommitment.id}/balance`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
    ).body as BalanceBody;
    expect(overpaid.totalPaid).toBe(110);
    expect(overpaid.remainingAmount).toBe(-10);
    expect(overpaid.status).toBe('overpaid');

    await request(app.getHttpServer())
      .delete(`/api/v1/payments/${secondPayment.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const afterDelete = (
      await request(app.getHttpServer())
        .get(`/api/v1/commitments/${supplierCommitment.id}/balance`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
    ).body as BalanceBody;
    expect(afterDelete.status).toBe('partially_paid');

    await request(app.getHttpServer())
      .post(`/api/v1/payments/${secondPayment.id}/restore`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    const intervenantCommitment = (
      await request(app.getHttpServer())
        .post('/api/v1/commitments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectId: project.id,
          beneficiaryType: 'intervenant',
          intervenantId: intervenant.id,
          description: 'Steel work',
          agreedAmount: 50,
          commitmentDate: '2026-01-02',
        })
        .expect(201)
    ).body as EntityBody;

    await request(app.getHttpServer())
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        projectId: project.id,
        commitmentId: intervenantCommitment.id,
        paymentDate: '2026-01-05',
        amount: 20,
        paymentMode: 'bank_transfer',
      })
      .expect(201);

    const category = await prisma.expenseCategory.findFirstOrThrow({
      where: { name: 'Béton' },
    });
    await request(app.getHttpServer())
      .post('/api/v1/expenses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        projectId: project.id,
        categoryId: category.id,
        supplierId: supplier.id,
        description: 'Concrete expense',
        amount: 25,
        expenseDate: '2026-01-06',
        paymentMode: 'cash',
      })
      .expect(201);

    const projectSummary = (
      await request(app.getHttpServer())
        .get(`/api/v1/projects/${project.id}/financial-summary`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
    ).body as ProjectSummaryBody;
    expect(projectSummary.totalCommitments).toBe(150);
    expect(projectSummary.totalPaid).toBe(130);
    expect(projectSummary.totalRemaining).toBe(20);
    expect(projectSummary.totalExpenses).toBe(25);

    const supplierSummary = (
      await request(app.getHttpServer())
        .get(`/api/v1/suppliers/${supplier.id}/financial-summary`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
    ).body as PartySummaryBody;
    expect(supplierSummary.totalCommitments).toBe(100);
    expect(supplierSummary.totalPaid).toBe(110);
    expect(supplierSummary.totalRemaining).toBe(-10);

    const intervenantSummary = (
      await request(app.getHttpServer())
        .get(`/api/v1/intervenants/${intervenant.id}/financial-summary`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
    ).body as PartySummaryBody;
    expect(intervenantSummary.totalCommitments).toBe(50);
    expect(intervenantSummary.totalPaid).toBe(20);
    expect(intervenantSummary.totalRemaining).toBe(30);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });
});
