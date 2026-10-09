import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateAlertRuleDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên quy tắc không được để trống' })
  name!: string;

  @IsNumber()
  @Min(0, { message: 'Ngưỡng tiêu cực tối thiểu là 0' })
  @Max(100, { message: 'Ngưỡng tiêu cực tối đa là 100' })
  negativeThreshold!: number;

  @IsInt()
  @Min(1, { message: 'Số ngày liên tiếp tối thiểu là 1' })
  @Max(30, { message: 'Số ngày liên tiếp tối đa là 30' })
  consecutiveDays!: number;

  @IsInt()
  @Min(1, { message: 'Cửa sổ thời gian tối thiểu là 1 ngày' })
  @Max(60, { message: 'Cửa sổ thời gian tối đa là 60 ngày' })
  timeWindowDays!: number;

  @IsString()
  @IsNotEmpty({ message: 'Mức cảnh báo (level) không được để trống' })
  level!: string; // nhe, vua, keo_dai

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
