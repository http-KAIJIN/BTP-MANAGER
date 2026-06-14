import { ConflictException, NotFoundException } from '@nestjs/common';
import { CompaniesService } from './companies.service';

describe('CompaniesService', () => {
  const prisma = {
    company: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };
  const service = new CompaniesService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('creates a company with actor audit field', async () => {
    prisma.company.findUnique.mockResolvedValue(null);
    prisma.company.create.mockResolvedValue({
      id: 'company-id',
      name: 'Inov Bati Pro',
    });

    await expect(
      service.create({ name: 'Inov Bati Pro', ice: 'ICE-1' }, 'actor-id'),
    ).resolves.toEqual({
      id: 'company-id',
      name: 'Inov Bati Pro',
    });
    expect(prisma.company.create).toHaveBeenCalledWith({
      data: { name: 'Inov Bati Pro', ice: 'ICE-1', createdById: 'actor-id' },
    });
  });

  it('rejects duplicate ICE', async () => {
    prisma.company.findUnique.mockResolvedValue({ id: 'other-id' });
    await expect(
      service.create({ name: 'Inov Bati Pro', ice: 'ICE-1' }, 'actor-id'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws when active company is not found', async () => {
    prisma.company.findFirst.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
