import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { ConstructionService } from './construction.service';

describe('ConstructionService', () => {
  let service: ConstructionService;
  let prisma: PrismaService;

  const mockPrisma = {
    project: {
      findFirst: jest.fn(),
    },
    constructionPhase: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConstructionService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ConstructionService>(ConstructionService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('getPhases', () => {
    it('should throw NotFoundException if project does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);
      await expect(service.getPhases('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return all 19 phases with global progress', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'proj-1' });
      mockPrisma.constructionPhase.findMany.mockResolvedValue([
        {
          id: 'phase-1',
          projectId: 'proj-1',
          name: 'Études',
          status: 'COMPLETED',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-02-01'),
          progress: 100,
          notes: 'Done',
          createdAt: new Date(),
        },
      ]);

      const result = await service.getPhases('proj-1');

      expect(result.phases).toHaveLength(19);
      expect(result.globalProgress).toBeGreaterThan(0);
      expect(result.phases[0].name).toBe('Études');
      expect(result.phases[0].status).toBe('completed');
    });
  });

  describe('updatePhase', () => {
    it('should create a phase record if none exists', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'proj-1' });
      mockPrisma.constructionPhase.findFirst.mockResolvedValue(null);
      mockPrisma.constructionPhase.create.mockResolvedValue({
        id: 'new-phase',
        projectId: 'proj-1',
        name: 'Fondations',
        status: 'IN_PROGRESS',
        progress: 50,
        notes: 'Started',
      });

      const result = await service.updatePhase(
        'proj-1',
        'Fondations',
        { status: 'in_progress', progress: 50, notes: 'Started' },
        'actor-1',
      );

      expect(mockPrisma.constructionPhase.create).toHaveBeenCalled();
      expect(result.status).toBe('IN_PROGRESS');
    });

    it('should update an existing phase record', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'proj-1' });
      mockPrisma.constructionPhase.findFirst.mockResolvedValue({
        id: 'existing-phase',
        projectId: 'proj-1',
        name: 'Fondations',
      });
      mockPrisma.constructionPhase.update.mockResolvedValue({
        id: 'existing-phase',
        status: 'COMPLETED',
        progress: 100,
      });

      const result = await service.updatePhase(
        'proj-1',
        'Fondations',
        { status: 'completed', progress: 100 },
        'actor-1',
      );

      expect(mockPrisma.constructionPhase.update).toHaveBeenCalled();
      expect(result.status).toBe('COMPLETED');
    });
  });

  describe('getProjectGlobalProgress', () => {
    it('should return global progress', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'proj-1' });
      mockPrisma.constructionPhase.findMany.mockResolvedValue([]);

      const result = await service.getProjectGlobalProgress('proj-1');
      expect(result.projectId).toBe('proj-1');
      expect(result.globalProgress).toBe(0);
    });
  });
});
