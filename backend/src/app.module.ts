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
import { ClientsModule } from './clients/clients.module';
import { CommitmentsModule } from './commitments/commitments.module';
import { ConstructionModule } from './construction/construction.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DocumentsModule } from './documents/documents.module';
import { ExpensesModule } from './expenses/expenses.module';
import { FinanceModule } from './finance/finance.module';
import { FinancialModule } from './financial/financial.module';
import { NumbersModule } from './numbers/numbers.module';
import { OcrModule } from './ocr/ocr.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { GoodsReceiptsModule } from './goods-receipts/goods-receipts.module';
import { StockModule } from './stock/stock.module';
import { QuotesModule } from './quotes/quotes.module';
import { InvoicesModule } from './invoices/invoices.module';
import { IntervenantsModule } from './intervenants/intervenants.module';
import { PaymentsModule } from './payments/payments.module';
import { PermissionsModule } from './permissions/permissions.module';
import { ProjectsModule } from './projects/projects.module';
import { RealEstateModule } from './real-estate/real-estate.module';
import { ReportsModule } from './reports/reports.module';
import { RolesModule } from './roles/roles.module';
import { SiteJournalModule } from './site-journal/site-journal.module';
import { AttendanceModule } from './attendance/attendance.module';
import { MaterialsModule } from './materials/materials.module';
import { SettingsModule } from './settings/settings.module';
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
    RealEstateModule,
    ReportsModule,
    SuppliersModule,
    IntervenantsModule,
    FinancialModule,
    ClientsModule,
    CommitmentsModule,
    ConstructionModule,
    DashboardModule,
    DocumentsModule,
    PaymentsModule,
    ExpensesModule,
    FinanceModule,
    NumbersModule,
    QuotesModule,
    InvoicesModule,
    SiteJournalModule,
    AttendanceModule,
    MaterialsModule,
    SettingsModule,
    PurchaseOrdersModule,
    GoodsReceiptsModule,
    StockModule,
    OcrModule,
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
