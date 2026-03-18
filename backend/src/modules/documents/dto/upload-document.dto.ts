import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadDocumentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @ApiProperty({
    description: 'Optional comment about the document',
    example: 'This is my initial submission',
    required: false,
    maxLength: 500,
  })
  comment?: string;
}
