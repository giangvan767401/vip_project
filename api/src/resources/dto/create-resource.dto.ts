import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateResourceDto {
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề tài liệu không được để trống' })
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty({ message: 'Loại tài liệu không được để trống (EXERCISE, ARTICLE, HOTLINE, TIP)' })
  type!: string;

  @IsString()
  @IsOptional()
  level?: string; // all, nhe, vua, keo_dai

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsInt()
  @IsOptional()
  durationMinutes?: number;
}
