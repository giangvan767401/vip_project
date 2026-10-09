import { IsEnum, IsNotEmpty } from 'class-validator';
import { AppointmentStatus } from '@prisma/client';

export class UpdateAppointmentStatusDto {
  @IsEnum(AppointmentStatus, { message: 'Trạng thái lịch hẹn phải là CONFIRMED hoặc CANCELLED' })
  @IsNotEmpty({ message: 'Vui lòng cung cấp trạng thái cần cập nhật' })
  status!: AppointmentStatus;
}
