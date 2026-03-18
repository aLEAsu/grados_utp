import { IsUUID, IsOptional, IsString } from 'class-validator';

/**
 * DTO for creating a new degree process
 */
export class CreateProcessDto {
  /**
   * ID of the modality to inscribe to
   * (THESIS, INTERNSHIP, RESEARCH_LINE, DIPLOMA)
   */
  @IsUUID()
  modalityId: string;

  /**
   * Optional title for the process/project
   */
  @IsOptional()
  @IsString()
  title?: string;

  /**
   * Optional description for the process/project
   */
  @IsOptional()
  @IsString()
  description?: string;
}
