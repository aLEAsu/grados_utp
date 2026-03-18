/**
 * Domain-specific custom errors
 * Pure TypeScript - no external dependencies or framework decorators
 */

/**
 * Base domain error class
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
    Object.setPrototypeOf(this, DomainError.prototype);
  }
}

/**
 * Thrown when an invalid state transition is attempted
 */
export class InvalidStateTransitionError extends DomainError {
  constructor(
    currentStatus: string,
    attemptedStatus: string,
    userRole: string,
  ) {
    const message = `Invalid state transition from ${currentStatus} to ${attemptedStatus} for role ${userRole}`;
    super(message);
    this.name = 'InvalidStateTransitionError';
    Object.setPrototypeOf(this, InvalidStateTransitionError.prototype);
  }
}

/**
 * Thrown when a business rule is violated
 */
export class BusinessRuleViolationError extends DomainError {
  constructor(message: string) {
    super(`Business rule violation: ${message}`);
    this.name = 'BusinessRuleViolationError';
    Object.setPrototypeOf(this, BusinessRuleViolationError.prototype);
  }
}

/**
 * Thrown when user lacks required permissions
 */
export class InsufficientPermissionsError extends DomainError {
  constructor(
    userRole: string,
    requiredRoles: string[],
  ) {
    const message = `User with role ${userRole} does not have permission. Required roles: ${requiredRoles.join(', ')}`;
    super(message);
    this.name = 'InsufficientPermissionsError';
    Object.setPrototypeOf(this, InsufficientPermissionsError.prototype);
  }
}
