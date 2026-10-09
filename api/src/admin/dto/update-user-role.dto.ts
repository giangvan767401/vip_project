import { IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserRoleDto {
  @IsEnum(Role, { message: 'Role phải là USER, COUNSELOR hoặc ADMIN' })
  role!: Role;
}
