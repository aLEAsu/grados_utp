import {
  IsEmail,
  IsString,
  MinLength,
  Matches,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, {
    message: 'Password must be at least 8 characters long',
  })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    },
  )
  password: string;

  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  firstName: string;

  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  lastName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  // Student profile fields
  @IsString()
  @MinLength(3, { message: 'Student code must be at least 3 characters long' })
  studentCode: string;

  @IsString()
  @MinLength(3, { message: 'Program must be at least 3 characters long' })
  program: string;

  @IsOptional()
  @IsString()
  faculty?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  semester?: number;
}
