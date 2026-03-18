import { IsOptional, IsUUID, IsString, IsEnum } from 'class-validator';
import { PaginationQueryDto } from '../../../shared/dto/pagination-query.dto';
import { ProcessStatus } from '../domain/process-state-machine';

/**
 * DTO for filtering degree processes with pagination
 * Extends PaginationQueryDto to inherit page and limit parameters
 */
export class ProcessFilterDto extends PaginationQueryDto {
  /**
   * Filter by process status
   */
  @IsOptional()
  @IsEnum(ProcessStatus)
  status?: ProcessStatus;

  /**
   * Filter by modality code
   * (THESIS, INTERNSHIP, RESEARCH_LINE, DIPLOMA)
   */
  @IsOptional()
  @IsString()
  modalityCode?: string;

  /**
   * Filter by student ID
   */
  @IsOptional()
  @IsUUID()
  studentId?: string;

  /**
   * Filter by advisor ID
   */
  @IsOptional()
  @IsUUID()
  advisorId?: string;

  /**
   * Free text search for title or student name
   */
  @IsOptional()
  @IsString()
  search?: string;
}
