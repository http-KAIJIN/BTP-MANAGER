import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpensesService } from './expenses.service';

@ApiTags('Expenses')
@ApiBearerAuth()
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}
  @Get() @Permissions('expenses.read') findAll(
    @Query() query: ExpenseQueryDto,
  ) {
    return this.expensesService.findAll(query);
  }
  @Post() @Permissions('expenses.create') create(
    @Body() dto: CreateExpenseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.expensesService.create(dto, user.id);
  }
  @Get(':id') @Permissions('expenses.read') findOne(@Param('id') id: string) {
    return this.expensesService.findOne(id);
  }
  @Patch(':id') @Permissions('expenses.update') update(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.expensesService.update(id, dto, user.id);
  }
  @Delete(':id') @Permissions('expenses.archive') remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.expensesService.softDelete(id, user.id);
  }
  @Post(':id/restore') @Permissions('expenses.archive') restore(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.expensesService.restore(id, user.id);
  }
}
