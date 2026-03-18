import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignDocumentDto {
  @ApiProperty({
    description: 'The ID of the requirement instance to sign',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  requirementInstanceId: string;

  @ApiProperty({
    description: 'The ID of the document version to sign',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  documentVersionId: string;
}
