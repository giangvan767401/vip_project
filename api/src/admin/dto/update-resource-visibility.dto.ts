import { IsBoolean } from 'class-validator';

export class UpdateResourceVisibilityDto {
  @IsBoolean({ message: 'isPublished phải là boolean' })
  isPublished!: boolean;
}
