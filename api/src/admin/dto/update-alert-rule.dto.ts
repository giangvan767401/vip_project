import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateAlertRuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  negativeThreshold?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  consecutiveDays?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  timeWindowDays?: number;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
