import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AlertResult {
  level: 'binh_thuong' | 'nhe' | 'vua' | 'keo_dai';
  totalNegativeDays: number;
  consecutiveNegativeDays: number;
  timeWindowDays: number;
  thresholdApplied: number;
  message: string;
  recommendation: string;
  activeRuleName: string;
  disclaimer: string;
  details: {
    date: string;
    label: string;
    avgNegative: number;
    isNegative: boolean;
  }[];
}

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async checkUserAlert(userId: string): Promise<AlertResult> {
    const now = new Date();
    const timeWindowDays = 7;
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDate = new Date(startOfToday.getTime() - (timeWindowDays - 1) * 24 * 60 * 60 * 1000);

    // 1. Lấy rules đang kích hoạt
    const rules = await this.prisma.alertRule.findMany({
      where: { isActive: true },
      orderBy: { negativeThreshold: 'desc' },
    });

    // Mặc định rule nếu rỗng: ngưỡng 50%, >=4 ngày
    const defaultNegativeThreshold = 50.0;

    // 2. Lấy logs của user trong 7 ngày
    const logs = await this.prisma.emotionLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // 3. Gom và tính điểm tiêu cực từng ngày
    const daysSummary: {
      date: string;
      label: string;
      avgNegative: number;
      isNegative: boolean;
    }[] = [];

    let totalNegativeDays = 0;
    let maxConsecutiveNegativeDays = 0;
    let currentConsecutive = 0;

    for (let i = timeWindowDays - 1; i >= 0; i--) {
      const dayStart = new Date(startOfToday.getTime() - i * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const dayLogs = logs.filter((l) => l.createdAt >= dayStart && l.createdAt < dayEnd);
      let avgNeg = 0;
      if (dayLogs.length > 0) {
        const sum = dayLogs.reduce((acc, curr) => acc + curr.negativeScore, 0);
        avgNeg = Number((sum / dayLogs.length).toFixed(1));
      }

      const isNeg = avgNeg >= defaultNegativeThreshold;
      if (isNeg) {
        totalNegativeDays++;
        currentConsecutive++;
        if (currentConsecutive > maxConsecutiveNegativeDays) {
          maxConsecutiveNegativeDays = currentConsecutive;
        }
      } else {
        currentConsecutive = 0;
      }

      daysSummary.push({
        date: dayStart.toISOString().slice(0, 10),
        label: `${String(dayStart.getDate()).padStart(2, '0')}/${String(dayStart.getMonth() + 1).padStart(2, '0')}`,
        avgNegative: avgNeg,
        isNegative: isNeg,
      });
    }

    // 4. Xác định mức cảnh báo theo rule (ưu tiên từ cao xuống thấp)
    let level: 'binh_thuong' | 'nhe' | 'vua' | 'keo_dai' = 'binh_thuong';
    let activeRuleName = 'Trạng thái ổn định';
    let message = 'Tâm trạng của bạn trong 7 ngày qua ở mức ổn định và tích cực.';
    let recommendation = 'Hãy tiếp tục duy trì lối sống lành mạnh, tập thể dục và check-in mỗi ngày nhé!';

    // Kiểm tra rule từ DB hoặc fallback
    const prolongedRule = rules.find((r) => r.level === 'keo_dai') || { consecutiveDays: 6 };
    const moderateRule = rules.find((r) => r.level === 'vua') || { consecutiveDays: 4 };
    const mildRule = rules.find((r) => r.level === 'nhe') || { consecutiveDays: 2 };

    if (totalNegativeDays >= prolongedRule.consecutiveDays || maxConsecutiveNegativeDays >= prolongedRule.consecutiveDays) {
      level = 'keo_dai';
      activeRuleName = 'Cảnh báo mức kéo dài (Nguy cơ cao)';
      message = `MindLog nhận thấy bạn đã có ${maxConsecutiveNegativeDays} ngày liên tiếp (tổng ${totalNegativeDays}/7 ngày) xuất hiện chỉ số cảm xúc tiêu cực và căng thẳng kéo dài.`;
      recommendation = 'Bạn đang chịu áp lực rất lớn. Đừng giữ một mình, hãy liên hệ ngay với Chuyên viên Tham vấn Tâm lý hoặc người thân để được hỗ trợ kịp thời.';
    } else if (totalNegativeDays >= moderateRule.consecutiveDays || maxConsecutiveNegativeDays >= moderateRule.consecutiveDays) {
      level = 'vua';
      activeRuleName = 'Cảnh báo mức vừa (≥4/7 ngày tiêu cực)';
      message = `MindLog ghi nhận bạn đã trải qua ${maxConsecutiveNegativeDays} ngày liên tiếp có điểm tiêu cực vượt ngưỡng trong tuần qua.`;
      recommendation = 'Bạn có thể đang chịu áp lực học tập hoặc stress. Hãy dành thời gian thư giãn với bài tập thở 4-7-8, viết nhật ký chia sẻ và cho phép bản thân nghỉ ngơi.';
    } else if (totalNegativeDays >= mildRule.consecutiveDays || maxConsecutiveNegativeDays >= mildRule.consecutiveDays) {
      level = 'nhe';
      activeRuleName = 'Nhắc nhở mức nhẹ';
      message = `Bạn có ${totalNegativeDays} ngày trong tuần xuất hiện chút căng thẳng hoặc mệt mỏi.`;
      recommendation = 'Hãy chú ý ngủ đủ giấc, giải lao giữa các giờ học và thực hành kỹ thuật thư giãn nhẹ nhàng.';
    }

    return {
      level,
      totalNegativeDays,
      consecutiveNegativeDays: maxConsecutiveNegativeDays,
      timeWindowDays,
      thresholdApplied: defaultNegativeThreshold,
      activeRuleName,
      message,
      recommendation,
      disclaimer: 'Cảnh báo và gợi ý được tính tự động từ tần suất cảm xúc ghi nhận, không thay thế cho chẩn đoán y tế hoặc đánh giá tâm thần chuyên nghiệp.',
      details: daysSummary,
    };
  }
}
