import { IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SectionsDto } from './sections.dto';

export class CreateBriefPreviewDto {
  @IsOptional()
  @IsInt()
  @Min(7)
  rangeDays?: number = 7;

  @IsOptional()
  @ValidateNested()
  @Type(() => SectionsDto)
  sections?: SectionsDto;

  @IsOptional()
  @IsString()
  userNote?: string;
}
