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
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}
  @Get() @Permissions('payments.read') findAll(
    @Query() query: PaymentQueryDto,
  ) {
    return this.paymentsService.findAll(query);
  }
  @Post() @Permissions('payments.create') create(
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.create(dto, user.id);
  }
  @Get(':id') @Permissions('payments.read') findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }
  @Patch(':id') @Permissions('payments.update') update(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.update(id, dto, user.id);
  }
  @Delete(':id') @Permissions('payments.archive') remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.softDelete(id, user.id);
  }
  @Post(':id/restore') @Permissions('payments.archive') restore(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.restore(id, user.id);
  }
}
