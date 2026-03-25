import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { StorageService } from '../../shared/storage/storage.service';
import * as forge from 'node-forge';
import * as fs from 'fs';
import * as path from 'path';
import { ApprovalDecision, ApprovalType, DocumentStatus, UserRole } from '@prisma/client';

export interface SignatureVerification {
  isValid: boolean;
  details: {
    signedBy: string;
    timestamp: string;
    documentHash: string;
  };
}

export interface CertificateInfo {
  serial: string;
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
}

export interface KeyPairGenerationResult {
  certificateInfo: CertificateInfo;
  message: string;
}

@Injectable()
export class SignaturesService {
  private logger = new Logger('SignaturesService');

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private storageService: StorageService,
  ) {}

  /**
   * Sign a document with the institutional private key
   * Only SECRETARY and ADMIN roles can sign documents
   * Both academic and administrative approvals must exist
   */
  async signDocument(
    requirementInstanceId: string,
    documentVersionId: string,
    signedByUserId: string,
  ) {
    this.logger.debug(
      `Attempting to sign document: requirementInstanceId=${requirementInstanceId}, documentVersionId=${documentVersionId}`,
    );

    // Validate user exists and has proper role
    const user = await this.prisma.user.findUnique({
      where: { id: signedByUserId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.SECRETARY && user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException(
        'Only SECRETARY or ADMIN users can sign documents',
      );
    }

    // Validate requirement instance exists
    const requirementInstance = await this.prisma.requirementInstance.findUnique({
      where: { id: requirementInstanceId },
      include: {
        documentVersions: true,
        approvals: true,
      },
    });

    if (!requirementInstance) {
      throw new NotFoundException('Requirement instance not found');
    }

    // Validate document version exists and belongs to this requirement
    const documentVersion = await this.prisma.documentVersion.findUnique({
      where: { id: documentVersionId },
    });

    if (!documentVersion) {
      throw new NotFoundException('Document version not found');
    }

    if (documentVersion.requirementInstanceId !== requirementInstanceId) {
      throw new BadRequestException(
        'Document version does not belong to this requirement instance',
      );
    }

    // Validate both ACADEMIC and ADMINISTRATIVE approvals exist and are APPROVED
    const academicApproval = await this.prisma.approval.findFirst({
      where: {
        requirementInstanceId,
        type: ApprovalType.ACADEMIC,
        decision: ApprovalDecision.APPROVED,
      },
    });

    const administrativeApproval = await this.prisma.approval.findFirst({
      where: {
        requirementInstanceId,
        type: ApprovalType.ADMINISTRATIVE,
        decision: ApprovalDecision.APPROVED,
      },
    });

    if (!academicApproval) {
      throw new BadRequestException(
        'Academic approval not found or not approved for this requirement',
      );
    }

    if (!administrativeApproval) {
      throw new BadRequestException(
        'Administrative approval not found or not approved for this requirement',
      );
    }

    // Validate requirement status is EN_REVISION or compatible
    if (requirementInstance.status !== DocumentStatus.EN_REVISION) {
      throw new BadRequestException(
        `Document must be in EN_REVISION status. Current status: ${requirementInstance.status}`,
      );
    }

    try {
      // Read document file from storage
      const documentBuffer = await this.storageService.getFile(
        documentVersion.storagePath,
      );

      // Compute SHA-256 hash of the document
      const md = forge.md.sha256.create();
      md.update(documentBuffer.toString('binary'));
      const documentHash = md.digest().toHex();

      // Load and sign with institutional private key
      const privateKeyPath = this.configService.get<string>(
        'signatures.privateKeyPath',
      );

      if (!privateKeyPath) {
        throw new Error(
          'SIGNATURE_PRIVATE_KEY_PATH not configured. Please generate keys first.',
        );
      }

      if (!fs.existsSync(privateKeyPath)) {
        throw new Error(
          `Private key file not found at ${privateKeyPath}. Please generate keys first.`,
        );
      }

      const privateKeyPem = fs.readFileSync(privateKeyPath, 'utf-8');
      const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);

      // Sign the hash
      const md2 = forge.md.sha256.create();
      md2.update(documentHash, 'hex' as any);
      const signature = privateKey.sign(md2);
      const signatureBase64 = Buffer.from(signature, 'binary').toString('base64');

      // Get certificate serial from the certificate file
      const certificatePath = this.configService.get<string>(
        'signatures.certificatePath',
      );
      let certificateSerial: string | null = null;

      if (certificatePath && fs.existsSync(certificatePath)) {
        try {
          const certPem = fs.readFileSync(certificatePath, 'utf-8');
          const cert = forge.pki.certificateFromPem(certPem);
          certificateSerial = cert.serialNumber;
        } catch (error) {
          this.logger.warn(`Could not read certificate serial: ${(error as any).message}`);
        }
      }

      // Create DigitalSignature record
      const signature_record = await this.prisma.digitalSignature.create({
        data: {
          requirementInstanceId,
          documentVersionId,
          signedById: signedByUserId,
          signatureHash: signatureBase64,
          certificateSerial,
          timestamp: new Date(),
          metadata: {
            algorithm: 'RSA-SHA256',
            keyId: 'institutional-key',
            documentHash,
          },
        },
        include: {
          signedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      this.logger.log(
        `Document signed successfully: ${requirementInstanceId} by user ${signedByUserId}`,
      );

      return signature_record;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to sign document: ${(error as any).message}`,
        (error as any).stack,
      );
      throw new BadRequestException(`Failed to sign document: ${(error as any).message}`);
    }
  }

  /**
   * Verify a digital signature
   */
  async verifySignature(signatureId: string): Promise<SignatureVerification> {
    this.logger.debug(`Verifying signature: ${signatureId}`);

    // Load the signature record
    const signature = await this.prisma.digitalSignature.findUnique({
      where: { id: signatureId },
      include: {
        documentVersion: true,
        signedBy: true,
      },
    });

    if (!signature) {
      throw new NotFoundException('Signature not found');
    }

    try {
      // Load the document from storage
      const documentBuffer = await this.storageService.getFile(
        signature.documentVersion.storagePath,
      );

      // Recompute hash
      const md = forge.md.sha256.create();
      md.update(documentBuffer.toString('binary'));
      const recomputedHash = md.digest().toHex();

      // Load public key from certificate
      const certificatePath = this.configService.get<string>(
        'signatures.certificatePath',
      );

      if (!certificatePath || !fs.existsSync(certificatePath)) {
        throw new Error(
          'Certificate file not found. Cannot verify signature.',
        );
      }

      const certPem = fs.readFileSync(certificatePath, 'utf-8');
      const cert = forge.pki.certificateFromPem(certPem);
      const publicKey = cert.publicKey;

      // Verify the signature
      const md2 = forge.md.sha256.create();
      md2.update(recomputedHash, 'hex' as any);
      const signatureBytes = Buffer.from(signature.signatureHash, 'base64').toString('binary');
      const isValid = (publicKey as any).verify(md2.digest().bytes(), signatureBytes);

      const result: SignatureVerification = {
        isValid,
        details: {
          signedBy: `${signature.signedBy.firstName} ${signature.signedBy.lastName}`,
          timestamp: signature.timestamp.toISOString(),
          documentHash: (signature.metadata as any)?.documentHash || recomputedHash,
        },
      };

      this.logger.log(
        `Signature verification completed: ${signatureId} - isValid: ${isValid}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to verify signature: ${(error as any).message}`,
        (error as any).stack,
      );
      throw new BadRequestException(
        `Failed to verify signature: ${(error as any).message}`,
      );
    }
  }

  /**
   * Get all signatures for a degree process
   */
  async getSignaturesByProcess(processId: string) {
    this.logger.debug(`Getting signatures for process: ${processId}`);

    const signatures = await this.prisma.digitalSignature.findMany({
      where: {
        requirementInstance: {
          degreeProcessId: processId,
        },
      },
      include: {
        signedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        documentVersion: {
          select: {
            id: true,
            fileName: true,
            originalFileName: true,
          },
        },
        requirementInstance: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return signatures;
  }

  /**
   * Get signature for a specific requirement instance
   */
  async getSignaturesByDocument(requirementInstanceId: string) {
    this.logger.debug(
      `Getting signatures for requirement: ${requirementInstanceId}`,
    );

    const signatures = await this.prisma.digitalSignature.findMany({
      where: {
        requirementInstanceId,
      },
      include: {
        signedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        documentVersion: {
          select: {
            id: true,
            fileName: true,
            originalFileName: true,
            versionNumber: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return signatures;
  }

  /**
   * Generate RSA 2048-bit key pair
   * ADMIN-only utility method
   * This is a setup utility, only runs once
   */
  async generateKeyPair(): Promise<KeyPairGenerationResult> {
    this.logger.log('Generating new RSA 2048-bit key pair for signatures');

    try {
      // Generate RSA key pair
      const keyPair = forge.pki.rsa.generateKeyPair({ bits: 2048 });

      // Create self-signed certificate
      const cert = forge.pki.createCertificate();
      cert.publicKey = keyPair.publicKey;
      cert.serialNumber = '01';
      cert.validity.notBefore = new Date();
      cert.validity.notAfter = new Date();
      cert.validity.notAfter.setFullYear(
        cert.validity.notAfter.getFullYear() + 5,
      );

      // Set certificate subject and issuer
      const attrs = [
        {
          name: 'commonName',
          value: 'Instituto Tecnologico del Putumayo - CIECYT',
        },
        {
          name: 'organizationName',
          value: 'Instituto Tecnologico del Putumayo',
        },
        {
          name: 'organizationalUnitName',
          value: 'CIECYT - Centro de Investigaciones',
        },
        { name: 'localityName', value: 'Mocoa' },
        { name: 'stateOrProvinceName', value: 'Putumayo' },
        { name: 'countryName', value: 'CO' },
      ];

      cert.setSubject(attrs);
      cert.setIssuer(attrs);

      // Self-sign the certificate
      cert.sign(keyPair.privateKey, forge.md.sha256.create());

      // Convert to PEM format
      const privateKeyPem = forge.pki.privateKeyToPem(keyPair.privateKey);
      const certificatePem = forge.pki.certificateToPem(cert);

      // Get paths from config
      const privateKeyPath = this.configService.get<string>(
        'signatures.privateKeyPath',
      ) || './certs/private-key.pem';
      const certificatePath = this.configService.get<string>(
        'signatures.certificatePath',
      ) || './certs/certificate.pem';

      // Create directory if needed
      const privateKeyDir = path.dirname(privateKeyPath);
      if (!fs.existsSync(privateKeyDir)) {
        fs.mkdirSync(privateKeyDir, { recursive: true });
      }

      // Save private key (with restricted permissions)
      fs.writeFileSync(privateKeyPath, privateKeyPem, { mode: 0o600 });
      this.logger.log(`Private key saved to ${privateKeyPath}`);

      // Save certificate
      fs.writeFileSync(certificatePath, certificatePem, { mode: 0o644 });
      this.logger.log(`Certificate saved to ${certificatePath}`);

      const result: KeyPairGenerationResult = {
        certificateInfo: {
          serial: cert.serialNumber,
          subject: `CN=${attrs[0].value}`,
          issuer: `CN=${attrs[0].value}`,
          validFrom: cert.validity.notBefore.toISOString(),
          validTo: cert.validity.notAfter.toISOString(),
        },
        message: 'Key pair generated and saved successfully',
      };

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to generate key pair: ${(error as any).message}`,
        (error as any).stack,
      );
      throw new BadRequestException(
        `Failed to generate key pair: ${(error as any).message}`,
      );
    }
  }

  /**
   * Get certificate information
   */
  async getCertificateInfo(): Promise<CertificateInfo> {
    this.logger.debug('Getting certificate information');

    try {
      const certificatePath = this.configService.get<string>(
        'signatures.certificatePath',
      );

      if (!certificatePath || !fs.existsSync(certificatePath)) {
        throw new NotFoundException(
          'Certificate file not found. Please generate keys first.',
        );
      }

      const certPem = fs.readFileSync(certificatePath, 'utf-8');
      const cert = forge.pki.certificateFromPem(certPem);

      // Format subject and issuer
      const formatName = (attrs: any[]) => {
        return attrs
          .map((attr) => `${attr.name}=${attr.value}`)
          .join(', ');
      };

      const certInfo: CertificateInfo = {
        serial: cert.serialNumber,
        subject: formatName(cert.subject.attributes),
        issuer: formatName(cert.issuer.attributes),
        validFrom: cert.validity.notBefore.toISOString(),
        validTo: cert.validity.notAfter.toISOString(),
      };

      return certInfo;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to get certificate info: ${(error as any).message}`,
        (error as any).stack,
      );
      throw new BadRequestException(
        `Failed to get certificate info: ${(error as any).message}`,
      );
    }
  }
}
