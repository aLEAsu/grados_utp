import { IsOptional, IsString, IsBoolean, IsEnum } from 'class-validator';
import { PaginationQueryDto } from '../../../shared/dto/pagination-query.dto';
import { UserRole } from '../../../shared/decorators/roles.decorator';

export class UserFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  search?: string; // Search by email, firstName, or lastName
}
