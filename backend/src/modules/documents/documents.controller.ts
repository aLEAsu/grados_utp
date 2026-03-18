import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { FileValidationPipe } from './pipes/file-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { JwtPayload } from '../../shared/decorators/current-user.decorator';

@ApiTags('Documents')
@Controller('documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  /**
   * Upload a new document version for a requirement instance
   */
  @Post('upload/:requirementInstanceId')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a document for a requirement instance' })
  @ApiParam({
    name: 'requirementInstanceId',
    type: 'string',
    description: 'Requirement instance ID',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Document file to upload',
        },
        comment: {
          type: 'string',
          description: 'Optional comment about the document',
          maxLength: 500,
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Document uploaded successfully',
    schema: {
      example: {
        id: 'uuid',
        requirementInstanceId: 'uuid',
        versionNumber: 1,
        fileName: 'filename.pdf',
        originalFileName: 'My Document.pdf',
        mimeType: 'application/pdf',
        fileSizeByte: 102400,
        storagePath: '2026/03/requirement-instance/uuid/abc123.pdf',
        hashSha256: 'hash_value',
        uploadedById: 'uuid',
        uploadedAt: '2026-03-18T12:00:00Z',
        comment: 'Initial submission',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file or validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Requirement instance not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized to upload' })
  async uploadDocument(
    @Param('requirementInstanceId') requirementInstanceId: string,
    @UploadedFile(FileValidationPipe) file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Note: comment would come from form data in a real multipart request
    // For now, we'll accept it as optional in the service call
    return this.documentsService.uploadDocument(
      requirementInstanceId,
      file,
      user.sub,
      undefined, // comment would be extracted from form data
    );
  }

  /**
   * Get all document versions for a requirement instance
   */
  @Get('requirement/:requirementInstanceId/versions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all document versions for a requirement' })
  @ApiParam({
    name: 'requirementInstanceId',
    type: 'string',
    description: 'Requirement instance ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Document versions retrieved successfully',
    schema: {
      example: [
        {
          id: 'uuid',
          requirementInstanceId: 'uuid',
          versionNumber: 1,
          fileName: 'filename.pdf',
          originalFileName: 'My Document.pdf',
          mimeType: 'application/pdf',
          fileSizeByte: 102400,
          storagePath: '2026/03/requirement-instance/uuid/abc123.pdf',
          hashSha256: 'hash_value',
          uploadedById: 'uuid',
          uploadedAt: '2026-03-18T12:00:00Z',
          comment: 'Initial submission',
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized to view' })
  @ApiResponse({ status: 404, description: 'Requirement instance not found' })
  async getDocumentVersions(
    @Param('requirementInstanceId') requirementInstanceId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.documentsService.getDocumentVersions(
      requirementInstanceId,
      user.sub,
      user.role,
    );
  }

  /**
   * Get a specific document version details
   */
  @Get(':versionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get details of a specific document version' })
  @ApiParam({
    name: 'versionId',
    type: 'string',
    description: 'Document version ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Document version details retrieved successfully',
    schema: {
      example: {
        id: 'uuid',
        requirementInstanceId: 'uuid',
        versionNumber: 1,
        fileName: 'filename.pdf',
        originalFileName: 'My Document.pdf',
        mimeType: 'application/pdf',
        fileSizeByte: 102400,
        storagePath: '2026/03/requirement-instance/uuid/abc123.pdf',
        hashSha256: 'hash_value',
        uploadedById: 'uuid',
        uploadedAt: '2026-03-18T12:00:00Z',
        comment: 'Initial submission',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Document version not found' })
  async getDocumentVersion(@Param('versionId') versionId: string) {
    return this.documentsService.getDocumentVersion(versionId);
  }

  /**
   * Download a document file
   */
  @Get(':versionId/download')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Download a document file' })
  @ApiParam({
    name: 'versionId',
    type: 'string',
    description: 'Document version ID',
  })
  @ApiResponse({
    status: 200,
    description: 'File downloaded successfully (binary content)',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized to download' })
  @ApiResponse({ status: 404, description: 'Document version not found' })
  async downloadDocument(
    @Param('versionId') versionId: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const { buffer, fileName, mimeType } = await this.documentsService.downloadDocument(
      versionId,
      user.sub,
      user.role,
    );

    // Set response headers
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      'Content-Length': buffer.length,
    });

    // Send the file buffer
    res.send(buffer);
  }

  /**
   * Get all requirements for a degree process with their latest versions
   */
  @Get('process/:processId/requirements')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all requirements for a degree process' })
  @ApiParam({
    name: 'processId',
    type: 'string',
    description: 'Degree process ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Requirements retrieved successfully',
    schema: {
      example: [
        {
          id: 'uuid',
          degreeProcessId: 'uuid',
          modalityRequirementId: 'uuid',
          status: 'PENDIENTE',
          createdAt: '2026-03-18T12:00:00Z',
          updatedAt: '2026-03-18T12:00:00Z',
          modalityRequirement: {
            id: 'uuid',
            displayOrder: 1,
            instructions: 'Upload your thesis proposal',
            documentType: {
              id: 'uuid',
              name: 'Thesis Proposal',
              code: 'THESIS_PROPOSAL',
              acceptedMimeTypes: ['application/pdf'],
              maxFileSizeMb: 10,
            },
          },
          documentVersions: [],
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized to view' })
  @ApiResponse({ status: 404, description: 'Degree process not found' })
  async getRequirementsByProcess(
    @Param('processId') processId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.documentsService.getRequirementsByProcess(
      processId,
      user.sub,
      user.role,
    );
  }

  /**
   * Delete a document version
   */
  @Delete(':versionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a document version' })
  @ApiParam({
    name: 'versionId',
    type: 'string',
    description: 'Document version ID',
  })
  @ApiResponse({
    status: 204,
    description: 'Document version deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete document in current state',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - only uploader can delete',
  })
  @ApiResponse({ status: 404, description: 'Document version not found' })
  async deleteDocumentVersion(
    @Param('versionId') versionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.documentsService.deleteDocumentVersion(versionId, user.sub);
  }
}
