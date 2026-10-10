import { IsBoolean, IsOptional } from 'class-validator';

export class SectionsDto {
  @IsOptional()
  @IsBoolean()
  includeTrend?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeNegativeDays?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeDifficultHours?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeActivities?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeJournalNotes?: boolean = true;
}
