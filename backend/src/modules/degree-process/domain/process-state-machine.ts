/**
 * Process State Machine
 * Pure TypeScript - no external dependencies or framework decorators
 * Manages the lifecycle of a degree process
 */

import {
  InvalidStateTransitionError,
  InsufficientPermissionsError,
} from './errors';

/**
 * Process states
 */
export enum ProcessStatus {
  DRAFT = 'DRAFT', // Initial state - application incomplete
  ACTIVE = 'ACTIVE', // Application submitted - awaiting document review
  IN_REVIEW = 'IN_REVIEW', // All required documents uploaded - under review
  APPROVED = 'APPROVED', // All documents approved with dual approval
  COMPLETED = 'COMPLETED', // Secretary finalized the process
  ARCHIVED = 'ARCHIVED', // Archived for preservation
}

/**
 * Transition rules with allowed next states and required roles
 */
interface TransitionRule {
  nextStates: ProcessStatus[];
  requiredRoles: string[];
  conditions?: string[];
}

/**
 * Process state machine implementation
 */
export class ProcessStateMachine {
  /**
   * Define all valid transitions for each status
   * Maps current status to possible transitions with role requirements
   */
  private static readonly TRANSITIONS: Map<ProcessStatus, TransitionRule> =
    new Map([
      [
        ProcessStatus.DRAFT,
        {
          nextStates: [ProcessStatus.ACTIVE],
          requiredRoles: ['STUDENT'],
          conditions: ['Advisor must be assigned', 'Required fields completed'],
        },
      ],
      [
        ProcessStatus.ACTIVE,
        {
          nextStates: [ProcessStatus.IN_REVIEW],
          requiredRoles: ['SECRETARY'],
          conditions: ['All required documents uploaded by student'],
        },
      ],
      [
        ProcessStatus.IN_REVIEW,
        {
          nextStates: [ProcessStatus.ACTIVE, ProcessStatus.APPROVED],
          requiredRoles: ['SECRETARY', 'ADVISOR'],
          conditions: [
            'For ACTIVE: Documents sent back for correction',
            'For APPROVED: All documents approved + dual approval',
          ],
        },
      ],
      [
        ProcessStatus.APPROVED,
        {
          nextStates: [ProcessStatus.COMPLETED],
          requiredRoles: ['SECRETARY'],
          conditions: ['Secretary finalizes the process'],
        },
      ],
      [
        ProcessStatus.COMPLETED,
        {
          nextStates: [ProcessStatus.ARCHIVED],
          requiredRoles: ['ADMIN', 'SECRETARY'],
          conditions: ['Process completion confirmed'],
        },
      ],
      [
        ProcessStatus.ARCHIVED,
        {
          nextStates: [],
          requiredRoles: [],
          conditions: ['Final state - no transitions allowed'],
        },
      ],
    ]);

  /**
   * Check if transition is allowed from current status to next status for a given role
   * @param currentStatus Current process status
   * @param nextStatus Target process status
   * @param userRole User's role
   * @returns true if transition is allowed, false otherwise
   */
  static canTransition(
    currentStatus: ProcessStatus,
    nextStatus: ProcessStatus,
    userRole: string,
  ): boolean {
    const rule = this.TRANSITIONS.get(currentStatus);

    if (!rule) {
      return false;
    }

    // Check if next status is in allowed states
    const isValidNextState = rule.nextStates.includes(nextStatus);
    if (!isValidNextState) {
      return false;
    }

    // Check if user role has permission
    const hasPermission = rule.requiredRoles.includes(userRole);
    return hasPermission;
  }

  /**
   * Get all available transitions for current status and user role
   * @param currentStatus Current process status
   * @param userRole User's role
   * @returns Array of allowed next statuses
   */
  static getAvailableTransitions(
    currentStatus: ProcessStatus,
    userRole: string,
  ): ProcessStatus[] {
    const rule = this.TRANSITIONS.get(currentStatus);

    if (!rule) {
      return [];
    }

    // Return next states only if user role has permission
    if (rule.requiredRoles.includes(userRole)) {
      return rule.nextStates;
    }

    return [];
  }

  /**
   * Validate a transition and throw error if invalid
   * @param currentStatus Current process status
   * @param nextStatus Target process status
   * @param userRole User's role
   * @throws InvalidStateTransitionError if transition is invalid
   * @throws InsufficientPermissionsError if user lacks permission
   */
  static validateTransition(
    currentStatus: ProcessStatus,
    nextStatus: ProcessStatus,
    userRole: string,
  ): void {
    const rule = this.TRANSITIONS.get(currentStatus);

    if (!rule) {
      throw new InvalidStateTransitionError(
        currentStatus,
        nextStatus,
        userRole,
      );
    }

    // Check if next status is allowed
    if (!rule.nextStates.includes(nextStatus)) {
      throw new InvalidStateTransitionError(
        currentStatus,
        nextStatus,
        userRole,
      );
    }

    // Check if user has permission
    if (!rule.requiredRoles.includes(userRole)) {
      throw new InsufficientPermissionsError(userRole, rule.requiredRoles);
    }
  }

  /**
   * Get all valid statuses
   * @returns Array of all ProcessStatus values
   */
  static getAllStatuses(): ProcessStatus[] {
    return Object.values(ProcessStatus);
  }

  /**
   * Check if a status is a terminal state
   * @param status Process status
   * @returns true if status is terminal (no further transitions), false otherwise
   */
  static isTerminalStatus(status: ProcessStatus): boolean {
    const rule = this.TRANSITIONS.get(status);
    return !rule || rule.nextStates.length === 0;
  }
}
