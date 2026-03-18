import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { FileValidationPipe } from './pipes/file-validation.pipe';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        storage: memoryStorage(),
        limits: {
          fileSize: configService.get<number>('app.maxFileSize') || 52428800, // 50MB default
        },
      }),
    }),
    SharedModule,
  ],
  providers: [DocumentsService, FileValidationPipe],
  controllers: [DocumentsController],
  exports: [DocumentsService],
})
export class DocumentsModule {}
