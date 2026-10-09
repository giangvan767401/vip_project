import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, IsDateString } from 'class-validator';

export class CreateJournalEntryDto {
  @IsInt({ message: 'Tâm trạng phải là số nguyên từ 1 đến 5' })
  @Min(1, { message: 'Tâm trạng tối thiểu là 1 (Rất tệ)' })
  @Max(5, { message: 'Tâm trạng tối đa là 5 (Rất tốt)' })
  mood!: number;

  @IsNotEmpty({ message: 'Ghi chú nhật ký không được để trống' })
  @IsString({ message: 'Ghi chú nhật ký phải là chuỗi ký tự' })
  note!: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày ghi nhật ký phải là định dạng ISO hợp lệ' })
  date?: string;
}
