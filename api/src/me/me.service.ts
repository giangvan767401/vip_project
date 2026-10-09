import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MeService {
  constructor(private readonly prisma: PrismaService) {}

  async exportData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const [emotionLogs, journalEntries, consents] = await Promise.all([
      this.prisma.emotionLog.findMany({
        where: { userId },
        orderBy: { startedAt: 'asc' },
      }),
      this.prisma.journalEntry.findMany({
        where: { userId },
        orderBy: { date: 'asc' },
      }),
      this.prisma.consentShare.findMany({
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
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      source: 'MindLog Platform',
      user,
      totalEmotionLogs: emotionLogs.length,
      totalJournalEntries: journalEntries.length,
      totalConsents: consents.length,
      emotionLogs,
      journalEntries,
      consents,
    };
  }

  async deleteData(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Mật khẩu không chính xác');
    }

    // Xóa EmotionLog, JournalEntry, ConsentShare của người dùng
    const [deletedLogs, deletedJournals, deletedConsents] = await this.prisma.$transaction([
      this.prisma.emotionLog.deleteMany({ where: { userId } }),
      this.prisma.journalEntry.deleteMany({ where: { userId } }),
      this.prisma.consentShare.deleteMany({ where: { userId } }),
    ]);

    return {
      message: 'Đã xóa toàn bộ dữ liệu nhật ký, cảm xúc và chia sẻ thành công',
      deletedCounts: {
        emotionLogs: deletedLogs.count,
        journalEntries: deletedJournals.count,
        consentShares: deletedConsents.count,
      },
    };
  }
}
