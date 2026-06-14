import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { CompaniesModule } from './companies/companies.module';
import { CommitmentsModule } from './commitments/commitments.module';
import { ConstructionModule } from './construction/construction.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ExpensesModule } from './expenses/expenses.module';
import { FinancialModule } from './financial/financial.module';
import { IntervenantsModule } from './intervenants/intervenants.module';
import { PaymentsModule } from './payments/payments.module';
import { PermissionsModule } from './permissions/permissions.module';
import { ProjectsModule } from './projects/projects.module';
import { RolesModule } from './roles/roles.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    CompaniesModule,
    ProjectsModule,
    SuppliersModule,
    IntervenantsModule,
    FinancialModule,
    CommitmentsModule,
    ConstructionModule,
    DashboardModule,
    PaymentsModule,
    ExpensesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
