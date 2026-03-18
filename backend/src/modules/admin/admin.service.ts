import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { UserRole } from '../../shared/decorators/roles.decorator';
import {
  CreateModalityDto,
  UpdateModalityDto,
  AddRequirementDto,
} from './dto/modality.dto';
import {
  CreateDocumentTypeDto,
  UpdateDocumentTypeDto,
} from './dto/document-type.dto';
import { UserFilterDto } from './dto/user-filter.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    const [
      totalStudents,
      processesByStatus,
      processesByModality,
      documentsPendingReview,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { role: UserRole.STUDENT },
      }),
      this.prisma.degreeProcess.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.degreeProcess.groupBy({
        by: ['modalityId'],
        _count: true,
      }),
      this.prisma.requirementInstance.count({
        where: { status: 'EN_REVISION' },
      }),
    ]);

    // Get recent activity (last 10 audit events)
    const recentActivity = await this.prisma.auditEvent.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return {
      totalStudents,
      processesByStatus,
      processesByModality,
      documentsPendingReview,
      recentActivity,
    };
  }

  /**
   * Get all modalities
   */
  async getModalities() {
    return this.prisma.degreeModality.findMany({
      include: {
        modalityRequirements: {
          include: {
            documentType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create a new modality
   */
  async createModality(dto: CreateModalityDto) {
    const existingModality = await this.prisma.degreeModality.findUnique({
      where: { code: dto.code },
    });

    if (existingModality) {
      throw new BadRequestException('Modality with this code already exists');
    }

    return this.prisma.degreeModality.create({
      data: {
        name: dto.name,
        code: dto.code as any, // Cast to enum
        description: dto.description,
        isActive: dto.isActive ?? true,
      },
    });
  }

  /**
   * Update a modality
   */
  async updateModality(id: string, dto: UpdateModalityDto) {
    const modality = await this.prisma.degreeModality.findUnique({
      where: { id },
    });

    if (!modality) {
      throw new NotFoundException('Modality not found');
    }

    return this.prisma.degreeModality.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Add requirement to modality
   */
  async addRequirementToModality(modalityId: string, dto: AddRequirementDto) {
    const modality = await this.prisma.degreeModality.findUnique({
      where: { id: modalityId },
    });

    if (!modality) {
      throw new NotFoundException('Modality not found');
    }

    const documentType = await this.prisma.documentType.findUnique({
      where: { id: dto.documentTypeId },
    });

    if (!documentType) {
      throw new NotFoundException('Document type not found');
    }

    const existingRequirement = await this.prisma.modalityRequirement.findUnique(
      {
        where: {
          modalityId_documentTypeId: {
            modalityId,
            documentTypeId: dto.documentTypeId,
          },
        },
      },
    );

    if (existingRequirement) {
      throw new BadRequestException(
        'This document type is already a requirement for this modality',
      );
    }

    return this.prisma.modalityRequirement.create({
      data: {
        modalityId,
        documentTypeId: dto.documentTypeId,
        isRequired: dto.isRequired ?? true,
        displayOrder: dto.displayOrder,
        instructions: dto.instructions,
      },
      include: {
        documentType: true,
        modality: true,
      },
    });
  }

  /**
   * Remove requirement from modality
   */
  async removeRequirementFromModality(
    modalityId: string,
    requirementId: string,
  ) {
    const requirement = await this.prisma.modalityRequirement.findUnique({
      where: { id: requirementId },
    });

    if (!requirement) {
      throw new NotFoundException('Requirement not found');
    }

    if (requirement.modalityId !== modalityId) {
      throw new BadRequestException('Requirement does not belong to this modality');
    }

    return this.prisma.modalityRequirement.delete({
      where: { id: requirementId },
    });
  }

  /**
   * Get all document types
   */
  async getDocumentTypes() {
    return this.prisma.documentType.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create a new document type
   */
  async createDocumentType(dto: CreateDocumentTypeDto) {
    const existingDocType = await this.prisma.documentType.findUnique({
      where: { code: dto.code },
    });

    if (existingDocType) {
      throw new BadRequestException('Document type with this code already exists');
    }

    return this.prisma.documentType.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        acceptedMimeTypes: dto.acceptedMimeTypes,
        maxFileSizeMb: dto.maxFileSizeMb ?? 10,
        templateUrl: dto.templateUrl,
      },
    });
  }

  /**
   * Update a document type
   */
  async updateDocumentType(id: string, dto: UpdateDocumentTypeDto) {
    const documentType = await this.prisma.documentType.findUnique({
      where: { id },
    });

    if (!documentType) {
      throw new NotFoundException('Document type not found');
    }

    return this.prisma.documentType.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Get users with optional filtering
   */
  async getUsers(filters: UserFilterDto) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update user role (SUPERADMIN only)
   */
  async updateUserRole(userId: string, newRole: UserRole) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent downgrading superadmin
    if (user.role === UserRole.SUPERADMIN && newRole !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Cannot downgrade a superadmin user');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });
  }

  /**
   * Toggle user active status
   */
  async toggleUserActive(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent deactivating superadmin
    if (user.role === UserRole.SUPERADMIN && user.isActive) {
      throw new ForbiddenException('Cannot deactivate a superadmin user');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });
  }

  /**
   * Get system health check
   */
  async getSystemHealth() {
    try {
      // Test database connection
      const dbHealthy = !!(await this.prisma.user.findFirst({
        take: 1,
        select: { id: true },
      }));

      return {
        status: 'healthy',
        database: dbHealthy ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: 'disconnected',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
