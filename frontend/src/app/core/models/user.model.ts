export enum UserRole {
  STUDENT = 'STUDENT',
  ADVISOR = 'ADVISOR',
  SECRETARY = 'SECRETARY',
  ADMIN = 'ADMIN',
  SUPERADMIN = 'SUPERADMIN'
}

export enum AcademicStatus {
  ACTIVE = 'ACTIVE',
  GRADUATED = 'GRADUATED',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  googleId?: string;
  createdAt: string;
  updatedAt: string;
  studentProfile?: StudentProfile;
  advisorProfile?: AdvisorProfile;
}

export interface StudentProfile {
  id: string;
  userId: string;
  studentCode: string;
  program: string;
  semester: number;
  academicStatus: AcademicStatus;
  externalStudentId?: string;
}

export interface AdvisorProfile {
  id: string;
  userId: string;
  department: string;
  specialization: string;
  maxActiveProcesses: number;
  currentActiveProcesses: number;
  isAvailable: boolean;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  firstName: string;
  iat?: number;
  exp?: number;
}
