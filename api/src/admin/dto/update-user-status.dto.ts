import { IsBoolean } from 'class-validator';

export class UpdateUserStatusDto {
  @IsBoolean({ message: 'isActive phải là boolean (true/false)' })
  isActive!: boolean;
}
