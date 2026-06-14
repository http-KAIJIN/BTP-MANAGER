import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { ExpenseCategoriesController } from './expense-categories.controller';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

@Module({
  imports: [PrismaModule],
  controllers: [ExpensesController, ExpenseCategoriesController],
  providers: [ExpensesService],
})
export class ExpensesModule {}
