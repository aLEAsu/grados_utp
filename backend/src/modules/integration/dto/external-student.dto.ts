/**
 * DTO for mapping external API student data
 * This is used as an anti-corruption layer to translate external API responses
 */
export interface ExternalStudentData {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  email: string;
  program: string;
  faculty: string;
  semester: number;
  academicStatus: string;
  completedSubjects?: number;
  totalSubjects?: number;
  hasCompletedAllSubjects: boolean;
  lastUpdated?: string;
}

/**
 * Internal representation of student data after mapping
 */
export interface InternalStudentData {
  studentCode: string;
  program: string;
  faculty: string;
  semester: number;
  academicStatus: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'SUSPENDED';
  hasCompletedSubjects: boolean;
  externalStudentId: string;
  lastSyncAt: Date;
}

/**
 * Student eligibility check result
 */
export interface StudentEligibilityResult {
  eligible: boolean;
  reason?: string;
}
