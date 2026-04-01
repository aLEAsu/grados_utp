import { IsString, IsOptional, IsBoolean, IsArray, IsInt, Min } from 'class-validator';

export class CreateModalityDto {
  @IsString()
  name: string;

  @IsString()
  code: string; // Será normalizado y validado usando la función normalizeAndValidateModalityCode

  @IsString()
  description: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateModalityDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AddRequirementDto {
  @IsString()
  documentTypeId: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsInt()
  @Min(1)
  displayOrder: number;

  @IsOptional()
  @IsString()
  instructions?: string;
}

export class RemoveRequirementDto {
  requirementId: string;
}
