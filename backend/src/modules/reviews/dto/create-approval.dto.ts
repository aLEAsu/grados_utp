import { IsEnum, IsOptional, IsString, MaxLength, IsUUID } from 'class-validator';
import { ApprovalDecision } from '@prisma/client';

export class CreateApprovalDto {
  @IsEnum(ApprovalDecision, {
    message: 'decision must be either APPROVED or REVISION_REQUESTED',
  })
  decision: ApprovalDecision;

  @IsOptional()
  @IsString()
  @MaxLength(2000, {
    message: 'observations must not exceed 2000 characters',
  })
  observations?: string;

  @IsUUID('4', {
    message: 'documentVersionId must be a valid UUID',
  })
  documentVersionId: string;
}
