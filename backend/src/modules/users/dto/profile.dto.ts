import {
  IsString,
  IsOptional,
  IsEmail,
  IsPhoneNumber,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';
import { AcademicStatus } from '@prisma/client';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

export class CreateStudentProfileDto {
  @IsString()
  studentCode: string;

  @IsString()
  program: string;

  @IsString()
  faculty: string;

  @IsInt()
  @Min(1)
  semester: number;

  @IsOptional()
  @IsEnum(AcademicStatus)
  academicStatus?: AcademicStatus;
}

export class CreateAdvisorProfileDto {
  @IsString()
  department: string;

  @IsString()
  specialization: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxActiveProcesses?: number;
}
