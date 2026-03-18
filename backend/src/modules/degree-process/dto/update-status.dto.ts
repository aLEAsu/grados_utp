import { IsEnum } from 'class-validator';
import { ProcessStatus } from '../domain/process-state-machine';

/**
 * DTO for updating the status of a degree process
 */
export class UpdateStatusDto {
  /**
   * Target status for the process
   */
  @IsEnum(ProcessStatus)
  status: ProcessStatus;
}
