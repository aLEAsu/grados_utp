import {
  Injectable,
  PipeTransform,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Express from 'express';

/**
 * File Validation Pipe
 * Validates file existence, size, and MIME type before processing
 */
@Injectable()
export class FileValidationPipe implements PipeTransform {
  private logger = new Logger('FileValidationPipe');
  private maxFileSize: number;
  // List of commonly allowed MIME types for documents
  private allowedMimeTypes = [
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-powerpoint', // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'text/plain', // .txt
    'image/jpeg', // .jpg, .jpeg
    'image/png', // .png
    'image/gif', // .gif
    'image/webp', // .webp
    'application/zip', // .zip
    'application/x-zip-compressed', // .zip (alternate)
  ];

  constructor(private configService: ConfigService) {
    this.maxFileSize = this.configService.get<number>('app.maxFileSize') || 52428800; // 50MB
  }

  transform(file: Express.Multer.File): Express.Multer.File {
    // Validate file exists
    if (!file) {
      throw new BadRequestException('No file provided. Please upload a file.');
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      const maxSizeMb = (this.maxFileSize / (1024 * 1024)).toFixed(2);
      const fileSizeMb = (file.size / (1024 * 1024)).toFixed(2);
      throw new BadRequestException(
        `File size (${fileSizeMb}MB) exceeds maximum allowed size of ${maxSizeMb}MB`,
      );
    }

    // Validate MIME type (basic validation - DocumentType validation happens in service)
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      this.logger.warn(
        `Attempted upload with unsupported MIME type: ${file.mimetype}`,
      );
      throw new BadRequestException(
        `File type ${file.mimetype} is not supported. Please upload a document file (PDF, Word, Excel, PowerPoint, text, image, or ZIP).`,
      );
    }

    // Validate file has a name
    if (!file.originalname) {
      throw new BadRequestException('File must have a valid filename');
    }

    this.logger.log(
      `File validation passed: ${file.originalname} (${file.size} bytes)`,
    );

    return file;
  }
}
