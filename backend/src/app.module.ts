import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DegreeProcessModule } from './modules/degree-process/degree-process.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { SignaturesModule } from './modules/signatures/signatures.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { IntegrationModule } from './modules/integration/integration.module';
import { AuditModule } from './modules/audit/audit.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    SharedModule,

    // Core Feature Modules
    AuthModule,
    UsersModule,
    DegreeProcessModule,
    DocumentsModule,
    ReviewsModule,
    SignaturesModule,
    NotificationsModule,
    IntegrationModule,
    AuditModule,
    AdminModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
