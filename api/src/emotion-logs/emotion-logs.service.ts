import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmotionLogDto } from './dto/create-emotion-log.dto';
import { AlertsService } from '../alerts/alerts.service';
import { CounselorGateway } from '../counselor/counselor.gateway';

@Injectable()
export class EmotionLogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alertsService: AlertsService,
    @Inject(forwardRef(() => CounselorGateway))
    private readonly counselorGateway: CounselorGateway,
  ) {}

  async create(userId: string, dto: CreateEmotionLogDto) {
    const log = await this.prisma.emotionLog.create({
      data: {
        userId,
        emotion: dto.emotion,
        positiveScore: dto.positiveScore,
        negativeScore: dto.negativeScore,
        startedAt: new Date(dto.startedAt),
        endedAt: new Date(dto.endedAt),
        scores: dto.scores ?? {},
        note: dto.note,
      },
    });

    // 9.3 Kiểm tra nếu user đạt mức cảnh báo nguy cơ kéo dài -> đẩy realtime tới counselor có consent ACTIVE
    try {
      const alert = await this.alertsService.checkUserAlert(userId);
      if (alert.level === 'keo_dai') {
        await this.counselorGateway.notifyProlongedAlert(userId, alert);
      }
    } catch (err) {
      console.error('Lỗi khi gửi thông báo realtime tới counselor:', err);
    }

    return log;
  }

  async findByUser(userId: string, limit = 50) {
    return this.prisma.emotionLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getSummary(userId: string, range: 'day' | 'week' = 'week') {
    const now = new Date();

    // Thiết lập mốc thời gian 7 ngày này và 7 ngày trước
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfCurrentWeek = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);
    const startOfPrevWeek = new Date(startOfCurrentWeek.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Lấy tất cả log trong 14 ngày qua để phục vụ tính toán
    const allLogs = await this.prisma.emotionLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: startOfPrevWeek,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Phân chia log
    const prevWeekLogs = allLogs.filter(
      (l) => l.createdAt >= startOfPrevWeek && l.createdAt < startOfCurrentWeek,
    );
    const currentWeekLogs = allLogs.filter(
      (l) => l.createdAt >= startOfCurrentWeek,
    );

    // Xác định logs cho phạm vi yêu cầu (range)
    let rangeLogs = currentWeekLogs;
    if (range === 'day') {
      rangeLogs = allLogs.filter((l) => l.createdAt >= startOfToday);
      // Nếu hôm nay chưa có bản ghi, lấy trong 24h qua để có dữ liệu trực quan
      if (rangeLogs.length === 0) {
        const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        rangeLogs = allLogs.filter((l) => l.createdAt >= past24h);
      }
    }

    // Helper tính trung bình & cảm xúc chủ đạo
    const calcStats = (logs: typeof allLogs) => {
      if (logs.length === 0) {
        return {
          avgPositiveScore: 0,
          avgNegativeScore: 0,
          totalCheckIns: 0,
          dominantEmotion: 'Chưa có',
        };
      }
      const sumPos = logs.reduce((acc, curr) => acc + curr.positiveScore, 0);
      const sumNeg = logs.reduce((acc, curr) => acc + curr.negativeScore, 0);
      
      const counts: Record<string, number> = {};
      for (const log of logs) {
        counts[log.emotion] = (counts[log.emotion] || 0) + 1;
      }
      let dominant = 'Neutral';
      let maxCount = -1;
      for (const [emotion, count] of Object.entries(counts)) {
        if (count > maxCount) {
          maxCount = count;
          dominant = emotion;
        }
      }

      return {
        avgPositiveScore: Number((sumPos / logs.length).toFixed(1)),
        avgNegativeScore: Number((sumNeg / logs.length).toFixed(1)),
        totalCheckIns: logs.length,
        dominantEmotion: dominant,
      };
    };

    const currentStats = calcStats(rangeLogs);
    const thisWeekStats = calcStats(currentWeekLogs);
    const prevWeekStats = calcStats(prevWeekLogs);

    // 1. Phân bố cảm xúc (distribution)
    const emotionCounts: Record<string, number> = {};
    for (const log of rangeLogs) {
      emotionCounts[log.emotion] = (emotionCounts[log.emotion] || 0) + 1;
    }
    const totalCount = rangeLogs.length || 1;
    const distribution = Object.entries(emotionCounts).map(([emotion, count]) => ({
      emotion,
      count,
      percentage: Number(((count / totalCount) * 100).toFixed(1)),
    })).sort((a, b) => b.count - a.count);

    // 2. Xu hướng (trend)
    let trend: Array<{
      label: string;
      date: string;
      avgPositive: number;
      avgNegative: number;
      dominantEmotion: string;
      count: number;
    }> = [];

    if (range === 'day') {
      // Gom theo các phiên check-in trong ngày
      trend = rangeLogs.map((log) => {
        const timeStr = new Date(log.createdAt).toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        });
        return {
          label: timeStr,
          date: log.createdAt.toISOString(),
          avgPositive: Number(log.positiveScore.toFixed(1)),
          avgNegative: Number(log.negativeScore.toFixed(1)),
          dominantEmotion: log.emotion,
          count: 1,
        };
      });
    } else {
      // Gom 7 ngày trong tuần hiện tại
      for (let i = 6; i >= 0; i--) {
        const d = new Date(startOfToday.getTime() - i * 24 * 60 * 60 * 1000);
        const nextD = new Date(d.getTime() + 24 * 60 * 60 * 1000);
        const dayLogs = currentWeekLogs.filter(
          (l) => l.createdAt >= d && l.createdAt < nextD,
        );

        const dayStats = calcStats(dayLogs);
        const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        const dateStr = d.toISOString().slice(0, 10);

        trend.push({
          label,
          date: dateStr,
          avgPositive: dayStats.avgPositiveScore,
          avgNegative: dayStats.avgNegativeScore,
          dominantEmotion: dayLogs.length > 0 ? dayStats.dominantEmotion : '-',
          count: dayStats.totalCheckIns,
        });
      }
    }

    // 3. So sánh theo ngày giữa tuần này và tuần trước (7 ngày đối chiếu)
    const comparisonByDay = [];
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    for (let i = 6; i >= 0; i--) {
      const curD = new Date(startOfToday.getTime() - i * 24 * 60 * 60 * 1000);
      const nextCurD = new Date(curD.getTime() + 24 * 60 * 60 * 1000);
      const curLogs = currentWeekLogs.filter(
        (l) => l.createdAt >= curD && l.createdAt < nextCurD,
      );

      const prevD = new Date(curD.getTime() - 7 * 24 * 60 * 60 * 1000);
      const nextPrevD = new Date(prevD.getTime() + 24 * 60 * 60 * 1000);
      const prLogs = prevWeekLogs.filter(
        (l) => l.createdAt >= prevD && l.createdAt < nextPrevD,
      );

      const curDayStats = calcStats(curLogs);
      const prevDayStats = calcStats(prLogs);

      comparisonByDay.push({
        dayName: dayNames[curD.getDay()],
        dateLabel: `${String(curD.getDate()).padStart(2, '0')}/${String(curD.getMonth() + 1).padStart(2, '0')}`,
        thisWeekPositive: curDayStats.avgPositiveScore,
        lastWeekPositive: prevDayStats.avgPositiveScore,
        thisWeekNegative: curDayStats.avgNegativeScore,
        lastWeekNegative: prevDayStats.avgNegativeScore,
      });
    }

    return {
      range,
      summary: currentStats,
      trend,
      distribution,
      comparison: {
        thisWeek: thisWeekStats,
        previousWeek: prevWeekStats,
        positiveDiff: Number(
          (thisWeekStats.avgPositiveScore - prevWeekStats.avgPositiveScore).toFixed(1),
        ),
        negativeDiff: Number(
          (thisWeekStats.avgNegativeScore - prevWeekStats.avgNegativeScore).toFixed(1),
        ),
        byDay: comparisonByDay,
      },
    };
  }
}

