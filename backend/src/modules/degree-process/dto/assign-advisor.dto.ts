import { IsUUID } from 'class-validator';

/**
 * DTO for assigning an advisor to a degree process
 */
export class AssignAdvisorDto {
  /**
   * ID of the user to assign as advisor
   * User must have ADVISOR role
   */
  @IsUUID()
  advisorUserId: string;
}
