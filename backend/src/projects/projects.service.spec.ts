import { BadRequestException } from '@nestjs/common';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  const prisma = {
    company: { findFirst: jest.fn() },
    project: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };
  const service = new ProjectsService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('accepts expected end date before start date (validation relaxed for mobile)', async () => {
    prisma.company.findFirst.mockResolvedValue({ id: 'company-id' });
    prisma.project.create.mockResolvedValue({
      id: 'project-id',
      name: 'Project',
    });
    await expect(
      service.create(
        {
          name: 'Project',
          city: 'Casablanca',
          startDate: '2026-02-01',
          expectedEndDate: '2026-01-01',
          ownershipType: 'internal_company',
          ownerCompanyId: 'company-id',
          executingCompanyId: 'company-id',
        },
        'actor-id',
      ),
    ).resolves.toBeDefined();
  });

  it('accepts internal projects without owner company (validation relaxed for mobile)', async () => {
    prisma.company.findFirst.mockResolvedValue({ id: 'company-id' });
    prisma.project.create.mockResolvedValue({
      id: 'project-id',
      name: 'Project',
    });
    await expect(
      service.create(
        {
          name: 'Project',
          city: 'Casablanca',
          startDate: '2026-01-01',
          ownershipType: 'internal_company',
          executingCompanyId: 'company-id',
        },
        'actor-id',
      ),
    ).resolves.toBeDefined();
  });

  it('creates a valid internal company project', async () => {
    prisma.company.findFirst.mockResolvedValue({ id: 'company-id' });
    prisma.project.create.mockResolvedValue({
      id: 'project-id',
      name: 'Project',
    });
    await service.create(
      {
        name: 'Project',
        city: 'Casablanca',
        startDate: '2026-01-01',
        ownershipType: 'internal_company',
        ownerCompanyId: 'company-id',
        executingCompanyId: 'company-id',
      },
      'actor-id',
    );
    const projectCreateMock = prisma.project.create as unknown as {
      mock: {
        calls: [[{ data: { ownershipType: string; createdById: string } }]];
      };
    };
    const createCall = projectCreateMock.mock.calls[0][0];
    expect(createCall.data.ownershipType).toBe('INTERNAL_COMPANY');
    expect(createCall.data.createdById).toBe('actor-id');
  });
});
