import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { StorageService } from './storage/storage.service';
import { PaginationService } from './pagination/pagination.service';

@Global()
@Module({
  providers: [PrismaService, StorageService, PaginationService],
  exports: [PrismaService, StorageService, PaginationService],
})
export class SharedModule {}
