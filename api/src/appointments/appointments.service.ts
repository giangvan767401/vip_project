import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentStatus, Role } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  // Sinh viên đặt lịch hẹn với chuyên viên tư vấn
  async create(userId: string, dto: CreateAppointmentDto) {
    if (userId === dto.counselorId) {
      throw new BadRequestException('Không thể đặt lịch hẹn với chính mình');
    }

    const counselor = await this.prisma.user.findFirst({
      where: { id: dto.counselorId, role: Role.COUNSELOR },
    });

    if (!counselor) {
      throw new NotFoundException('Không tìm thấy chuyên viên tư vấn chỉ định');
    }

    const startAt = new Date(dto.startAt);
    if (isNaN(startAt.getTime())) {
      throw new BadRequestException('Thời gian bắt đầu không hợp lệ');
    }

    if (startAt.getTime() < Date.now() - 5 * 60 * 1000) {
      throw new BadRequestException('Không thể đặt lịch hẹn trong quá khứ');
    }

    // 10.1: Chặn trùng giờ của cùng counselor (khoảng cách tối thiểu 30 phút giữa các lịch hẹn)
    const slotStart = new Date(startAt.getTime() - 30 * 60 * 1000);
    const slotEnd = new Date(startAt.getTime() + 30 * 60 * 1000);

    const conflictingAppointment = await this.prisma.appointment.findFirst({
      where: {
        counselorId: dto.counselorId,
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
        startAt: {
          gte: slotStart,
          lte: slotEnd,
        },
      },
    });

    if (conflictingAppointment) {
      throw new ConflictException(
        'Chuyên viên tư vấn đã có lịch hẹn trong khung giờ này. Vui lòng chọn thời gian khác.',
      );
    }

    return this.prisma.appointment.create({
      data: {
        userId,
        counselorId: dto.counselorId,
        startAt,
        note: dto.note ?? null,
        status: AppointmentStatus.PENDING,
      },
      include: {
        counselor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  // Sinh viên xem danh sách lịch hẹn của chính mình
  async findMyStudentAppointments(userId: string) {
    return this.prisma.appointment.findMany({
      where: { userId },
      include: {
        counselor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { startAt: 'desc' },
    });
  }

  // Chuyên viên xem danh sách lịch hẹn gửi đến mình
  async findCounselorAppointments(counselorId: string) {
    return this.prisma.appointment.findMany({
      where: { counselorId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { startAt: 'desc' },
    });
  }

  // Sinh viên hủy lịch hẹn của mình
  async cancelByStudent(userId: string, appointmentId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, userId },
    });

    if (!appointment) {
      throw new NotFoundException('Không tìm thấy lịch hẹn');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      return appointment;
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.CANCELLED,
      },
      include: {
        counselor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  // Chuyên viên xác nhận hoặc từ chối lịch hẹn
  async updateStatusByCounselor(
    counselorId: string,
    appointmentId: string,
    status: AppointmentStatus,
  ) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, counselorId },
    });

    if (!appointment) {
      throw new NotFoundException('Không tìm thấy lịch hẹn của chuyên viên');
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }
}
