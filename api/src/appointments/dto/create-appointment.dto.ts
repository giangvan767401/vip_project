import { IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng chọn chuyên viên tư vấn' })
  counselorId!: string;

  @IsISO8601({}, { message: 'Thời gian bắt đầu không hợp lệ (định dạng ISO8601)' })
  @IsNotEmpty({ message: 'Vui lòng chọn thời gian bắt đầu lịch hẹn' })
  startAt!: string;

  @IsString()
  @IsOptional()
  note?: string;
}
