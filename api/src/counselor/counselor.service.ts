import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmotionLogsService } from '../emotion-logs/emotion-logs.service';
import { AlertsService } from '../alerts/alerts.service';
import { ConsentStatus } from '@prisma/client';

@Injectable()
export class CounselorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emotionLogsService: EmotionLogsService,
    private readonly alertsService: AlertsService,
  ) {}

  // 9.1 Lấy danh sách client đang có ConsentShare ACTIVE với counselor này
  async getClients(counselorId: string) {
    const consents = await this.prisma.consentShare.findMany({
      where: {
        counselorId,
        status: ConsentStatus.ACTIVE,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: { grantedAt: 'desc' },
    });

    const clientsWithStatus = await Promise.all(
      consents.map(async (c) => {
        const alert = await this.alertsService.checkUserAlert(c.user.id);
        const lastLog = await this.prisma.emotionLog.findFirst({
          where: { userId: c.user.id },
          orderBy: { createdAt: 'desc' },
        });

        return {
          consentId: c.id,
          grantedAt: c.grantedAt,
          student: c.user,
          alertLevel: alert.level,
          activeRuleName: alert.activeRuleName,
          consecutiveNegativeDays: alert.consecutiveNegativeDays,
          lastCheckIn: lastLog ? lastLog.createdAt : null,
          lastEmotion: lastLog ? lastLog.emotion : null,
        };
      }),
    );

    return clientsWithStatus;
  }

  // 9.1 Lấy chi tiết summary của một sinh viên - BẮT BUỘC kiểm tra ConsentShare ACTIVE trực tiếp từ DB
  async getClientSummary(counselorId: string, studentId: string, range: 'day' | 'week' = 'week') {
    // Kiểm tra trực tiếp DB - KHÔNG CACHE
    const activeConsent = await this.prisma.consentShare.findFirst({
      where: {
        userId: studentId,
        counselorId,
        status: ConsentStatus.ACTIVE,
      },
    });

    if (!activeConsent) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập dữ liệu của sinh viên này hoặc sinh viên đã thu hồi quyền chia sẻ.',
      );
    }

    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Không tìm thấy thông tin sinh viên');
    }

    const [summary, alert, recentLogs] = await Promise.all([
      this.emotionLogsService.getSummary(studentId, range),
      this.alertsService.checkUserAlert(studentId),
      this.prisma.emotionLog.findMany({
        where: { userId: studentId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      student,
      consent: {
        id: activeConsent.id,
        grantedAt: activeConsent.grantedAt,
      },
      summary,
      alert,
      recentLogs,
    };
  }

  // 9.2 Thống kê ẩn danh toàn hệ thống - Chỉ trả khi nhóm >= 5 người
  async getSystemStats() {
    const userGroups = await this.prisma.emotionLog.groupBy({
      by: ['userId'],
    });

    const totalStudentsWithData = userGroups.length;

    // QUY TẮC BẢO VỆ RIÊNG TƯ: Nhóm < 5 người thì từ chối trả chi tiết
    if (totalStudentsWithData < 5) {
      return {
        hasEnoughData: false,
        minimumRequired: 5,
        currentCount: totalStudentsWithData,
        message: 'Dữ liệu chưa đạt ngưỡng tối thiểu (nhóm ≥ 5 người) để hiển thị thống kê ẩn danh nhằm đảm bảo an toàn danh tính sinh viên.',
      };
    }

    // Nếu >= 5 người: Trả thống kê ẩn danh hoàn toàn
    const allLogs = await this.prisma.emotionLog.findMany({
      select: {
        emotion: true,
        positiveScore: true,
        negativeScore: true,
        createdAt: true,
      },
    });

    const totalLogs = allLogs.length;
    const avgPositive =
      totalLogs > 0
        ? Number((allLogs.reduce((acc, l) => acc + l.positiveScore, 0) / totalLogs).toFixed(1))
        : 0;
    const avgNegative =
      totalLogs > 0
        ? Number((allLogs.reduce((acc, l) => acc + l.negativeScore, 0) / totalLogs).toFixed(1))
        : 0;

    const emotionDistribution: Record<string, number> = {};
    for (const log of allLogs) {
      emotionDistribution[log.emotion] = (emotionDistribution[log.emotion] || 0) + 1;
    }

    const distribution = Object.entries(emotionDistribution)
      .map(([emotion, count]) => ({
        emotion,
        count,
        percentage: Number(((count / totalLogs) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.count - a.count);

    return {
      hasEnoughData: true,
      totalStudents: totalStudentsWithData,
      totalCheckIns: totalLogs,
      avgPositiveScore: avgPositive,
      avgNegativeScore: avgNegative,
      distribution,
    };
  }
}
