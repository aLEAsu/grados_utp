import { SetMetadata } from '@nestjs/common';

/**
 * User roles - must match Prisma UserRole enum exactly
 */
export enum UserRole {
  STUDENT = 'STUDENT',
  ADVISOR = 'ADVISOR',
  SECRETARY = 'SECRETARY',
  ADMIN = 'ADMIN',
  SUPERADMIN = 'SUPERADMIN',
}

export const ROLES_KEY = 'roles';

/**
 * Decorator to restrict endpoint access to specific roles.
 * Usage: @Roles(UserRole.ADMIN, UserRole.SECRETARY)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
