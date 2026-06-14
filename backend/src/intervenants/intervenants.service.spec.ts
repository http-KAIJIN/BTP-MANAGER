import { NotFoundException } from '@nestjs/common';
import { IntervenantsService } from './intervenants.service';

describe('IntervenantsService', () => {
  const prisma = {
    intervenant: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };
  const service = new IntervenantsService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('creates an intervenant with actor audit field', async () => {
    prisma.intervenant.create.mockResolvedValue({
      id: 'intervenant-id',
      name: 'Ahmed',
    });
    await service.create({ name: 'Ahmed', trade: 'Ferronnier' }, 'actor-id');
    expect(prisma.intervenant.create).toHaveBeenCalledWith({
      data: { name: 'Ahmed', trade: 'Ferronnier', createdById: 'actor-id' },
    });
  });

  it('restores an archived intervenant', async () => {
    prisma.intervenant.findUnique.mockResolvedValue({ id: 'intervenant-id' });
    prisma.intervenant.update.mockResolvedValue({
      id: 'intervenant-id',
      deletedAt: null,
    });
    await service.restore('intervenant-id', 'actor-id');
    expect(prisma.intervenant.update).toHaveBeenCalledWith({
      where: { id: 'intervenant-id' },
      data: {
        deletedAt: null,
        deletedById: null,
        status: 'ACTIVE',
        updatedById: 'actor-id',
      },
    });
  });

  it('throws when active intervenant is not found', async () => {
    prisma.intervenant.findFirst.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
