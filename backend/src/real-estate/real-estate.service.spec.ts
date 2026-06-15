import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { PropertiesService } from './properties.service';
import { SalesService } from './sales.service';

describe('PropertiesService', () => {
  let propertiesService: PropertiesService;
  const mockPrisma = {
    property: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    project: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    propertiesService = module.get<PropertiesService>(PropertiesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated properties', async () => {
      mockPrisma.property.findMany.mockResolvedValue([
        { id: 'p1', reference: 'APT-001' },
      ]);
      mockPrisma.property.count.mockResolvedValue(1);
      const result = await propertiesService.findAll({});
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should throw if property not found', async () => {
      mockPrisma.property.findFirst.mockResolvedValue(null);
      await expect(propertiesService.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

describe('SalesService', () => {
  let salesService: SalesService;
  const mockPrisma = {
    sale: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    salePayment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    client: {
      findFirst: jest.fn(),
    },
    property: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    salesService = module.get<SalesService>(SalesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated sales', async () => {
      mockPrisma.sale.findMany.mockResolvedValue([
        { id: 's1', salePrice: '100000' },
      ]);
      mockPrisma.sale.count.mockResolvedValue(1);
      const result = await salesService.findAll({});
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should throw if sale not found', async () => {
      mockPrisma.sale.findFirst.mockResolvedValue(null);
      await expect(salesService.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
