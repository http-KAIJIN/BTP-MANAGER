import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { DocumentsService } from './documents.service';

describe('DocumentsService', () => {
  let service: DocumentsService;
  const mockPrisma = {
    document: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return documents for a project', async () => {
      mockPrisma.document.findMany.mockResolvedValue([
        { id: 'doc-1', name: 'test.pdf', originalName: 'test.pdf', mimeType: 'application/pdf', size: 1000, category: 'Plans', projectId: 'proj-1', createdAt: new Date() },
      ]);
      const result = await service.findAll('proj-1');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test.pdf');
    });
  });

  describe('findOne', () => {
    it('should throw if document not found', async () => {
      mockPrisma.document.findFirst.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should return document if found', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({ id: 'doc-1', name: 'test.pdf' });
      const result = await service.findOne('doc-1');
      expect(result.id).toBe('doc-1');
    });
  });

  describe('delete', () => {
    it('should soft delete a document', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({ id: 'doc-1' });
      mockPrisma.document.update.mockResolvedValue({ id: 'doc-1', deletedAt: new Date() });
      const result = await service.delete('doc-1', 'actor-1');
      expect(result.success).toBe(true);
    });
  });
});
