import { IsNotEmpty, IsString, IsNumber, IsOptional, IsDateString, Min, Max, IsObject } from 'class-validator';

export class CreateEmotionLogDto {
  @IsNotEmpty({ message: 'Cảm xúc không được để trống' })
  @IsString({ message: 'Cảm xúc phải là chuỗi' })
  emotion!: string;

  @IsNumber({}, { message: 'positiveScore phải là số' })
  @Min(0, { message: 'positiveScore tối thiểu là 0' })
  @Max(100, { message: 'positiveScore tối đa là 100' })
  positiveScore!: number;

  @IsNumber({}, { message: 'negativeScore phải là số' })
  @Min(0, { message: 'negativeScore tối thiểu là 0' })
  @Max(100, { message: 'negativeScore tối đa là 100' })
  negativeScore!: number;

  @IsDateString({}, { message: 'startedAt phải là chuỗi ISO datetime hợp lệ' })
  startedAt!: string;

  @IsDateString({}, { message: 'endedAt phải là chuỗi ISO datetime hợp lệ' })
  endedAt!: string;

  @IsOptional()
  @IsObject({ message: 'scores phải là object' })
  scores?: Record<string, number>;

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  note?: string;
}
