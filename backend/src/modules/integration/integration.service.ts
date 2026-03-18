import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  ExternalStudentData,
  InternalStudentData,
  StudentEligibilityResult,
} from './dto/external-student.dto';
import { IntegrationException } from './exceptions/integration.exception';

@Injectable()
export class IntegrationService {
  private baseUrl: string;
  private apiKey: string;
  private maxRetries = 2;
  private retryDelay = 1000; // 1 second

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.baseUrl = this.configService.get<string>('ITP_API_BASE_URL', 'https://api.example.com');
    this.apiKey = this.configService.get<string>('ITP_API_KEY', '');
  }

  /**
   * Fetch student data from external API with retry logic
   */
  async fetchStudentData(studentCode: string): Promise<ExternalStudentData> {
    return this.withRetry(async () => {
      const url = `${this.baseUrl}/students/${studentCode}`;

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
        });

        if (!response.ok) {
          throw new IntegrationException(
            `External API returned status ${response.status}: ${response.statusText}`,
          );
        }

        const data = await response.json();
        return data as ExternalStudentData;
      } catch (error) {
        throw new IntegrationException(
          `Failed to fetch student data from external API: ${(error as Error).message}`,
          error as Error,
        );
      }
    });
  }

  /**
   * Sync student profile with external data
   */
  async syncStudentProfile(userId: string): Promise<InternalStudentData> {
    // Get user and student profile
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { studentProfile: true },
    });

    if (!user) {
      throw new IntegrationException('User not found');
    }

    if (!user.studentProfile) {
      throw new IntegrationException('Student profile not found');
    }

    // Fetch external data
    const externalData = await this.fetchStudentData(user.studentProfile.studentCode);

    // Map to internal format
    const internalData = this.mapExternalToInternal(externalData);

    // Update student profile
    const updatedProfile = await this.prisma.studentProfile.update({
      where: { userId },
      data: {
        program: internalData.program,
        faculty: internalData.faculty,
        semester: internalData.semester,
        academicStatus: internalData.academicStatus,
        hasCompletedSubjects: internalData.hasCompletedSubjects,
        externalStudentId: internalData.externalStudentId,
        lastSyncAt: internalData.lastSyncAt,
      },
    });

    return internalData;
  }

  /**
   * Validate student eligibility based on completed subjects
   */
  async validateStudentEligibility(studentCode: string): Promise<StudentEligibilityResult> {
    try {
      const externalData = await this.fetchStudentData(studentCode);

      const hasCompletedAllSubjects = externalData.hasCompletedAllSubjects ?? false;

      if (hasCompletedAllSubjects) {
        return {
          eligible: true,
        };
      } else {
        return {
          eligible: false,
          reason: `Student has not completed all required subjects (${externalData.completedSubjects ?? 0}/${externalData.totalSubjects ?? 0})`,
        };
      }
    } catch (error) {
      throw new IntegrationException(
        `Failed to validate student eligibility: ${(error as Error).message}`,
        error as Error,
      );
    }
  }

  /**
   * Anti-Corruption Layer: Map external API fields to internal model
   * Handles missing/null fields gracefully
   */
  private mapExternalToInternal(externalData: ExternalStudentData): InternalStudentData {
    const academicStatusMap: Record<string, 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'SUSPENDED'> = {
      'ACTIVE': 'ACTIVE',
      'INACTIVE': 'INACTIVE',
      'GRADUATED': 'GRADUATED',
      'SUSPENDED': 'SUSPENDED',
      'active': 'ACTIVE',
      'inactive': 'INACTIVE',
      'graduated': 'GRADUATED',
      'suspended': 'SUSPENDED',
    };

    const mappedStatus = academicStatusMap[externalData.academicStatus] || 'ACTIVE';

    return {
      studentCode: externalData.code || externalData.id,
      program: externalData.program || 'UNKNOWN',
      faculty: externalData.faculty || 'UNKNOWN',
      semester: externalData.semester ?? 1,
      academicStatus: mappedStatus,
      hasCompletedSubjects: externalData.hasCompletedAllSubjects ?? false,
      externalStudentId: externalData.id,
      lastSyncAt: new Date(externalData.lastUpdated || new Date()),
    };
  }

  /**
   * Helper method for retry logic
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    attemptNumber = 0,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (attemptNumber < this.maxRetries) {
        console.warn(`Attempt ${attemptNumber + 1} failed, retrying in ${this.retryDelay}ms...`);
        await this.delay(this.retryDelay);
        return this.withRetry(fn, attemptNumber + 1);
      }

      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
