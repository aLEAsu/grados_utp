import { IsString, IsOptional, IsArray, IsInt, Min, Max } from 'class-validator';

export class CreateDocumentTypeDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  acceptedMimeTypes: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  maxFileSizeMb?: number;

  @IsOptional()
  @IsString()
  templateUrl?: string;
}

export class UpdateDocumentTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  acceptedMimeTypes?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  maxFileSizeMb?: number;

  @IsOptional()
  @IsString()
  templateUrl?: string;
}
