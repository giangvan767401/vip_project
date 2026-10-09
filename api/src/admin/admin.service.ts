import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateCounselorDto } from './dto/create-counselor.dto';
import { UpdateAlertRuleDto } from './dto/update-alert-rule.dto';
import { CreateAlertRuleDto } from './dto/create-alert-rule.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // 11.1 QUẢN LÝ TÀI KHOẢN (NGHIÊM NGẶT BẢO MẬT)
  // KHÔNG TRẢ DỮ LIỆU CẢM XÚC/NHẬT KÝ CÁ NHÂN
  // ==========================================
  async getUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            emotionLogs: true,
            journalEntries: true,
            appointmentsStudent: true,
            appointmentsCounselor: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      total: users.length,
      users,
    };
  }

  async createCounselor(dto: CreateCounselorDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException('Email này đã được sử dụng trong hệ thống');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const counselor = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        fullName: dto.fullName.trim(),
        password: hashedPassword,
        role: Role.COUNSELOR,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return counselor;
  }

  async updateUserRole(targetUserId: string, currentAdminId: string, newRole: Role) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (targetUserId === currentAdminId && newRole !== Role.ADMIN) {
      throw new BadRequestException('Không thể tự hạ quyền của chính mình');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  async updateUserStatus(targetUserId: string, currentAdminId: string, isActive: boolean) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (targetUserId === currentAdminId && !isActive) {
      throw new BadRequestException('Không thể tự khóa tài khoản quản trị của chính mình');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  // ==========================================
  // 11.2 QUẢN LÝ NGƯỠNG CẢNH BÁO (ALERT RULES)
  // ==========================================
  async getAlertRules() {
    return this.prisma.alertRule.findMany({
      orderBy: { negativeThreshold: 'desc' },
    });
  }

  async createAlertRule(dto: CreateAlertRuleDto) {
    return this.prisma.alertRule.create({
      data: {
        name: dto.name.trim(),
        negativeThreshold: dto.negativeThreshold,
        consecutiveDays: dto.consecutiveDays,
        timeWindowDays: dto.timeWindowDays,
        level: dto.level,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });
  }

  async updateAlertRule(id: string, dto: UpdateAlertRuleDto) {
    const existing = await this.prisma.alertRule.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy quy tắc cảnh báo');
    }

    return this.prisma.alertRule.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.negativeThreshold !== undefined && { negativeThreshold: dto.negativeThreshold }),
        ...(dto.consecutiveDays !== undefined && { consecutiveDays: dto.consecutiveDays }),
        ...(dto.timeWindowDays !== undefined && { timeWindowDays: dto.timeWindowDays }),
        ...(dto.level !== undefined && { level: dto.level }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteAlertRule(id: string) {
    const existing = await this.prisma.alertRule.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy quy tắc cảnh báo');
    }

    await this.prisma.alertRule.delete({
      where: { id },
    });

    return { message: 'Đã xóa quy tắc cảnh báo thành công', id };
  }

  // ==========================================
  // 11.3 THỐNG KÊ HỆ THỐNG & KIỂM DUYỆT TÀI LIỆU
  // TỔNG HỢP VĨ MÔ - TUYỆT ĐỐI KHÔNG CÓ DỮ LIỆU CÁ NHÂN
  // ==========================================
  async getStats() {
    const [
      totalUsers,
      totalStudents,
      totalCounselors,
      totalAdmins,
      totalEmotionLogs,
      totalJournalEntries,
      totalAppointments,
      appointmentsConfirmed,
      appointmentsPending,
      appointmentsCancelled,
      totalResources,
      totalActiveConsents,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: Role.USER } }),
      this.prisma.user.count({ where: { role: Role.COUNSELOR } }),
      this.prisma.user.count({ where: { role: Role.ADMIN } }),
      this.prisma.emotionLog.count(),
      this.prisma.journalEntry.count(),
      this.prisma.appointment.count(),
      this.prisma.appointment.count({ where: { status: 'CONFIRMED' } }),
      this.prisma.appointment.count({ where: { status: 'PENDING' } }),
      this.prisma.appointment.count({ where: { status: 'CANCELLED' } }),
      this.prisma.resource.count(),
      this.prisma.consentShare.count({ where: { status: 'ACTIVE' } }),
    ]);

    return {
      users: {
        total: totalUsers,
        students: totalStudents,
        counselors: totalCounselors,
        admins: totalAdmins,
      },
      activities: {
        totalEmotionLogs,
        totalJournalEntries,
        totalActiveConsents,
      },
      appointments: {
        total: totalAppointments,
        confirmed: appointmentsConfirmed,
        pending: appointmentsPending,
        cancelled: appointmentsCancelled,
      },
      resources: {
        total: totalResources,
      },
    };
  }

  async getAllResources() {
    return this.prisma.resource.findMany({
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateResourceVisibility(id: string, isPublished: boolean) {
    const existing = await this.prisma.resource.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy tài liệu');
    }

    return this.prisma.resource.update({
      where: { id },
      data: { isPublished },
    });
  }

  async deleteResource(id: string) {
    const existing = await this.prisma.resource.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy tài liệu');
    }

    await this.prisma.resource.delete({
      where: { id },
    });

    return { message: 'Đã xóa tài liệu thành công', id };
  }
}
