import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateObservationDto {
  @IsString()
  @MinLength(10, {
    message: 'content must be at least 10 characters long',
  })
  @MaxLength(2000, {
    message: 'content must not exceed 2000 characters',
  })
  content: string;

  @IsOptional()
  @IsUUID('4', {
    message: 'documentVersionId must be a valid UUID if provided',
  })
  documentVersionId?: string;
}
