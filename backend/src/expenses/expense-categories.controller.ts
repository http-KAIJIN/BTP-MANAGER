import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../common/decorators/permissions.decorator';
import { getPagination, paginatedResponse } from '../common/utils/pagination';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../database/prisma.service';

@ApiTags('Expense Categories')
@ApiBearerAuth()
@Controller('expense-categories')
export class ExpenseCategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Permissions('expenses.read')
  async findAll(@Query() query: PaginationQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const [data, total] = await Promise.all([
      this.prisma.expenseCategory.findMany({
        where: { deletedAt: null, isActive: true },
        orderBy: { name: 'asc' },
        skip,
        take,
      }),
      this.prisma.expenseCategory.count({
        where: { deletedAt: null, isActive: true },
      }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }
}
