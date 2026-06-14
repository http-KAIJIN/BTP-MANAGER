import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FinancialService } from '../financial/financial.service';
import { PrismaService } from '../database/prisma.service';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: PrismaService;

  const mockPrisma = {
    project: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    supplier: {
      findFirst: jest.fn(),
    },
    intervenant: {
      findFirst: jest.fn(),
    },
    commitment: {
      findMany: jest.fn(),
    },
    constructionPhase: {
      findMany: jest.fn(),
    },
  };

  const mockFinancial = {
    getProjectFinancialSummary: jest.fn(),
    getSupplierFinancialSummary: jest.fn(),
    getIntervenantFinancialSummary: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: FinancialService, useValue: mockFinancial },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('getProjectReport', () => {
    it('should throw if project not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);
      await expect(service.getProjectReport('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return project report with financial data', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({
        id: 'proj-1',
        name: 'Test Project',
        city: 'Casablanca',
        status: 'ACTIVE',
        startDate: new Date('2026-01-01'),
        expectedEndDate: null,
        executingCompany: { name: 'Exec Co' },
        ownerCompany: null,
        commitments: [],
        payments: [],
        expenses: [],
      });

      mockFinancial.getProjectFinancialSummary.mockResolvedValue({
        totalCommitments: 100000,
        totalPaid: 60000,
        totalRemaining: 40000,
        totalExpenses: 20000,
      });

      mockPrisma.constructionPhase.findMany.mockResolvedValue([]);

      const result = await service.getProjectReport('proj-1');
      expect(result.project.name).toBe('Test Project');
      expect(result.financial.totalCommitments).toBe(100000);
    });
  });

  describe('getSupplierReport', () => {
    it('should throw if supplier not found', async () => {
      mockPrisma.supplier.findFirst.mockResolvedValue(null);
      await expect(service.getSupplierReport('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getIntervenantReport', () => {
    it('should throw if intervenant not found', async () => {
      mockPrisma.intervenant.findFirst.mockResolvedValue(null);
      await expect(
        service.getIntervenantReport('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getProjectsCsv', () => {
    it('should return CSV string', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      const csv = await service.getProjectsCsv();
      expect(csv).toContain('Name,City,Status');
    });
  });
});
