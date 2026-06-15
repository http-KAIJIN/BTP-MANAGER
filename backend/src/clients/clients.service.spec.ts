import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { ClientsService } from './clients.service';

describe('ClientsService', () => {
  let service: ClientsService;
  const mockPrisma = {
    client: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated clients', async () => {
      mockPrisma.client.findMany.mockResolvedValue([
        { id: 'c1', name: 'Client 1' },
      ]);
      mockPrisma.client.count.mockResolvedValue(1);
      const result = await service.findAll({});
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should throw if client not found', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a client', async () => {
      const dto = { name: 'New Client', phone: '0600000000', cin: 'AB123456' };
      mockPrisma.client.create.mockResolvedValue({ id: 'new-id', ...dto });
      const result = await service.create(dto, 'actor-1');
      expect(result.name).toBe('New Client');
    });
  });
});
