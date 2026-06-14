import { NotFoundException } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';

describe('SuppliersService', () => {
  const prisma = {
    supplier: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };
  const service = new SuppliersService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('creates a supplier with actor audit field', async () => {
    prisma.supplier.create.mockResolvedValue({
      id: 'supplier-id',
      name: 'Supplier',
    });
    await service.create({ name: 'Supplier', category: 'Béton' }, 'actor-id');
    expect(prisma.supplier.create).toHaveBeenCalledWith({
      data: { name: 'Supplier', category: 'Béton', createdById: 'actor-id' },
    });
  });

  it('soft deletes supplier by archiving it', async () => {
    prisma.supplier.findFirst.mockResolvedValue({ id: 'supplier-id' });
    prisma.supplier.update.mockResolvedValue({ id: 'supplier-id' });
    await expect(
      service.softDelete('supplier-id', 'actor-id'),
    ).resolves.toEqual({ success: true });
    const supplierUpdateMock = prisma.supplier.update as unknown as {
      mock: {
        calls: [
          [
            {
              where: { id: string };
              data: { deletedById: string; status: string };
            },
          ],
        ];
      };
    };
    const updateCall = supplierUpdateMock.mock.calls[0][0];
    expect(updateCall.where.id).toBe('supplier-id');
    expect(updateCall.data.deletedById).toBe('actor-id');
    expect(updateCall.data.status).toBe('ARCHIVED');
  });

  it('throws when active supplier is not found', async () => {
    prisma.supplier.findFirst.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
