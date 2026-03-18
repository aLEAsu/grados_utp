import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { SignaturesService } from './signatures.service';
import { SignDocumentDto } from './dto/sign-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles, UserRole } from '../../shared/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../shared/decorators/current-user.decorator';

@ApiTags('Digital Signatures')
@Controller('signatures')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SignaturesController {
  constructor(private signaturesService: SignaturesService) {}

  @Post('sign')
  @Roles(UserRole.SECRETARY, UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Sign a document with digital signature',
    description:
      'Sign a document after both academic and administrative approvals. Only SECRETARY and ADMIN users can perform this action.',
  })
  @ApiBody({ type: SignDocumentDto })
  @ApiResponse({
    status: 201,
    description: 'Document signed successfully',
    schema: {
      example: {
        id: 'uuid',
        requirementInstanceId: 'uuid',
        documentVersionId: 'uuid',
        signedById: 'uuid',
        signatureHash: 'base64-encoded-signature',
        certificateSerial: '01',
        timestamp: '2026-03-18T10:30:00Z',
        metadata: {
          algorithm: 'RSA-SHA256',
          keyId: 'institutional-key',
          documentHash: 'hex-encoded-sha256',
        },
        signedBy: {
          id: 'uuid',
          email: 'secretary@example.com',
          firstName: 'Juan',
          lastName: 'Pérez',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or document not ready for signing',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - must be authenticated',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Document or requirement not found',
  })
  async signDocument(
    @Body() dto: SignDocumentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.signaturesService.signDocument(
      dto.requirementInstanceId,
      dto.documentVersionId,
      user.sub,
    );
  }

  @Get('verify/:signatureId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify a digital signature',
    description: 'Verify the authenticity and integrity of a digital signature',
  })
  @ApiParam({
    name: 'signatureId',
    description: 'The ID of the signature to verify',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Signature verification result',
    schema: {
      example: {
        isValid: true,
        details: {
          signedBy: 'Juan Pérez',
          timestamp: '2026-03-18T10:30:00Z',
          documentHash: 'a1b2c3d4e5f6...',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Failed to verify signature',
  })
  @ApiResponse({
    status: 404,
    description: 'Signature not found',
  })
  async verifySignature(@Param('signatureId') signatureId: string) {
    return await this.signaturesService.verifySignature(signatureId);
  }

  @Get('process/:processId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all signatures for a degree process',
    description: 'Retrieve all digital signatures associated with a degree process',
  })
  @ApiParam({
    name: 'processId',
    description: 'The ID of the degree process',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of signatures for the process',
    schema: {
      example: [
        {
          id: 'uuid',
          requirementInstanceId: 'uuid',
          documentVersionId: 'uuid',
          timestamp: '2026-03-18T10:30:00Z',
          signedBy: {
            id: 'uuid',
            email: 'secretary@example.com',
            firstName: 'Juan',
            lastName: 'Pérez',
          },
          documentVersion: {
            id: 'uuid',
            fileName: 'document.pdf',
            originalFileName: 'myfile.pdf',
          },
          requirementInstance: {
            id: 'uuid',
            status: 'APROBADO',
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - must be authenticated',
  })
  async getSignaturesByProcess(@Param('processId') processId: string) {
    return await this.signaturesService.getSignaturesByProcess(processId);
  }

  @Get('requirement/:requirementInstanceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get signatures for a specific requirement',
    description:
      'Retrieve all digital signatures for a specific requirement instance',
  })
  @ApiParam({
    name: 'requirementInstanceId',
    description: 'The ID of the requirement instance',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Signature(s) for the requirement',
    schema: {
      example: [
        {
          id: 'uuid',
          requirementInstanceId: 'uuid',
          documentVersionId: 'uuid',
          timestamp: '2026-03-18T10:30:00Z',
          signedBy: {
            id: 'uuid',
            email: 'secretary@example.com',
            firstName: 'Juan',
            lastName: 'Pérez',
          },
          documentVersion: {
            id: 'uuid',
            fileName: 'document.pdf',
            originalFileName: 'myfile.pdf',
            versionNumber: 1,
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - must be authenticated',
  })
  async getSignaturesByDocument(
    @Param('requirementInstanceId') requirementInstanceId: string,
  ) {
    return await this.signaturesService.getSignaturesByDocument(
      requirementInstanceId,
    );
  }

  @Post('generate-keys')
  @Roles(UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate institutional RSA key pair',
    description:
      'Generate a new RSA 2048-bit key pair for digital signatures. SUPERADMIN only. This is a one-time setup operation.',
  })
  @ApiResponse({
    status: 201,
    description: 'Key pair generated successfully',
    schema: {
      example: {
        certificateInfo: {
          serial: '01',
          subject: 'CN=Instituto Tecnologico del Putumayo - CIECYT',
          issuer: 'CN=Instituto Tecnologico del Putumayo - CIECYT',
          validFrom: '2026-03-18T10:30:00Z',
          validTo: '2031-03-18T10:30:00Z',
        },
        message: 'Key pair generated and saved successfully',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Failed to generate key pair',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - must be authenticated',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - only SUPERADMIN can generate keys',
  })
  async generateKeyPair() {
    return await this.signaturesService.generateKeyPair();
  }

  @Get('certificate')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get institutional certificate information',
    description: 'Retrieve information about the institutional signing certificate',
  })
  @ApiResponse({
    status: 200,
    description: 'Certificate information',
    schema: {
      example: {
        serial: '01',
        subject: 'CN=Instituto Tecnologico del Putumayo - CIECYT, O=Instituto Tecnologico del Putumayo, OU=CIECYT - Centro de Investigaciones, L=Mocoa, ST=Putumayo, C=CO',
        issuer: 'CN=Instituto Tecnologico del Putumayo - CIECYT, O=Instituto Tecnologico del Putumayo, OU=CIECYT - Centro de Investigaciones, L=Mocoa, ST=Putumayo, C=CO',
        validFrom: '2026-03-18T10:30:00Z',
        validTo: '2031-03-18T10:30:00Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Failed to retrieve certificate information',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - must be authenticated',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Certificate not found - please generate keys first',
  })
  async getCertificateInfo() {
    return await this.signaturesService.getCertificateInfo();
  }
}
