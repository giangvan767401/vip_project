import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AlertsService } from '../alerts/alerts.service';
import { ActivityTemplate } from '@prisma/client';

export interface TodayActivitiesResponse {
  today: string;
  alertLevel: string;
  swapsRemaining: number;
  activities: any[];
}

export interface ActivityStreakResponse {
  currentStreak: number;
  maxStreak: number;
  isTodayCompleted: boolean;
  totalCompletedAllTime: number;
  recentHistory: {
    date: string;
    total: number;
    completed: number;
    isSuccess: boolean;
  }[];
}

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alertsService: AlertsService,
  ) {}

  /**
   * Lấy chuỗi ngày YYYY-MM-DD theo múi giờ Việt Nam (Asia/Ho_Chi_Minh)
   */
  getVietnamDateString(d: Date = new Date()): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  }

  /**
   * Tạo Date object chuẩn UTC 00:00:00 cho ngày Việt Nam tương ứng
   */
  getVietnamDate(d: Date = new Date()): Date {
    const dateStr = this.getVietnamDateString(d);
    return new Date(`${dateStr}T00:00:00.000Z`);
  }

  /**
   * 1. GET /activities/today
   * Lấy hoặc sinh danh sách 3 hoạt động nhỏ cho ngày hôm nay theo mức cảnh báo hiện tại.
   * Gọi nhiều lần trong ngày trả về cùng danh sách. Không trùng lặp các việc của hôm qua.
   */
  async getTodayActivities(userId: string): Promise<TodayActivitiesResponse> {
    const today = this.getVietnamDate();
    const todayStr = this.getVietnamDateString(today);

    // 1. Kiểm tra xem đã có danh sách hôm nay chưa
    let activities = await this.prisma.dailyActivity.findMany({
      where: { userId, date: today },
      include: { template: true },
      orderBy: { createdAt: 'asc' },
    });

    // 2. Lấy số lượt đổi đã dùng trong ngày hôm nay
    const swapRecord = await this.prisma.activityDailySwap.findUnique({
      where: { userId_date: { userId, date: today } },
    });
    const swapCount = swapRecord?.count || 0;
    const swapsRemaining = Math.max(0, 2 - swapCount);

    // 3. Lấy mức cảnh báo hiện tại của user để phản hồi
    const alert = await this.alertsService.checkUserAlert(userId);
    const userLevel = alert.level; // 'binh_thuong' | 'nhe' | 'vua' | 'keo_dai'

    // Nếu đã có danh sách hôm nay -> trả về ngay
    if (activities.length > 0) {
      return {
        today: todayStr,
        alertLevel: userLevel,
        swapsRemaining,
        activities,
      };
    }

    // 4. Chưa có danh sách hôm nay -> Sinh mới 3 hoạt động
    // Tìm danh sách hoạt động ngày hôm qua để tránh trùng lặp
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayActivities = await this.prisma.dailyActivity.findMany({
      where: { userId, date: yesterday },
      select: { templateId: true },
    });
    const yesterdayTemplateIds = yesterdayActivities.map((a) => a.templateId);

    // Lấy pool hoạt động phù hợp mức cảm xúc
    let candidates = await this.prisma.activityTemplate.findMany({
      where: {
        isActive: true,
        OR: [{ level: 'all' }, { level: userLevel }],
      },
    });

    // Nếu không đủ, bổ sung tất cả hoạt động đang active
    if (candidates.length < 4) {
      candidates = await this.prisma.activityTemplate.findMany({
        where: { isActive: true },
      });
    }

    // Lọc bỏ các việc đã làm hôm qua (nếu còn đủ >= 3 lựa chọn)
    const filteredCandidates = candidates.filter(
      (c) => !yesterdayTemplateIds.includes(c.id),
    );
    const pool = filteredCandidates.length >= 3 ? filteredCandidates : candidates;

    // Chọn 3 hoạt động đa dạng danh mục (category)
    const selected: ActivityTemplate[] = [];
    const categoriesSeen = new Set<string>();
    const shuffled = [...pool].sort(() => 0.5 - Math.random());

    for (const item of shuffled) {
      if (!categoriesSeen.has(item.category)) {
        selected.push(item);
        categoriesSeen.add(item.category);
        if (selected.length === 3) break;
      }
    }

    // Nếu chưa đủ 3 do số category ít, lấy thêm từ pool
    if (selected.length < 3) {
      for (const item of shuffled) {
        if (!selected.some((s) => s.id === item.id)) {
          selected.push(item);
          if (selected.length === 3) break;
        }
      }
    }

    // Lưu vào DailyActivity
    for (const tmpl of selected) {
      await this.prisma.dailyActivity.create({
        data: {
          userId,
          templateId: tmpl.id,
          date: today,
        },
      });
    }

    // Đọc lại danh sách hoàn chỉnh
    activities = await this.prisma.dailyActivity.findMany({
      where: { userId, date: today },
      include: { template: true },
      orderBy: { createdAt: 'asc' },
    });

    return {
      today: todayStr,
      alertLevel: userLevel,
      swapsRemaining,
      activities,
    };
  }

  /**
   * 2. POST /activities/:id/complete
   * Đánh dấu hoàn thành hoạt động
   */
  async completeActivity(id: string, userId: string) {
    const item = await this.prisma.dailyActivity.findUnique({
      where: { id },
      include: { template: true },
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy hoạt động');
    }
    if (item.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa hoạt động này');
    }

    return this.prisma.dailyActivity.update({
      where: { id },
      data: { completedAt: new Date() },
      include: { template: true },
    });
  }

  /**
   * 3. DELETE /activities/:id/complete
   * Bỏ tick hoàn thành
   */
  async uncompleteActivity(id: string, userId: string) {
    const item = await this.prisma.dailyActivity.findUnique({
      where: { id },
      include: { template: true },
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy hoạt động');
    }
    if (item.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa hoạt động này');
    }

    return this.prisma.dailyActivity.update({
      where: { id },
      data: { completedAt: null },
      include: { template: true },
    });
  }

  /**
   * 4. POST /activities/:id/swap
   * Đổi việc khác (tối đa 2 lần/ngày)
   */
  async swapActivity(id: string, userId: string) {
    const item = await this.prisma.dailyActivity.findUnique({
      where: { id },
      include: { template: true },
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy hoạt động');
    }
    if (item.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền đổi hoạt động này');
    }

    const today = this.getVietnamDate();
    const itemDateStr = this.getVietnamDateString(item.date);
    const todayStr = this.getVietnamDateString(today);

    if (itemDateStr !== todayStr) {
      throw new BadRequestException('Chỉ có thể đổi việc trong ngày hôm nay');
    }

    // Kiểm tra giới hạn 2 lần đổi mỗi ngày
    const swapRecord = await this.prisma.activityDailySwap.findUnique({
      where: { userId_date: { userId, date: today } },
    });
    const currentSwapCount = swapRecord?.count || 0;

    if (currentSwapCount >= 2) {
      throw new BadRequestException('Bạn đã dùng hết 2 lượt đổi hoạt động trong hôm nay');
    }

    // Các template đang có trong ngày của user
    const currentActivities = await this.prisma.dailyActivity.findMany({
      where: { userId, date: today },
      select: { templateId: true },
    });
    const excludeIds = currentActivities.map((a) => a.templateId);

    // Lấy alert level để chọn template phù hợp
    const alert = await this.alertsService.checkUserAlert(userId);
    const userLevel = alert.level;

    let candidates = await this.prisma.activityTemplate.findMany({
      where: {
        isActive: true,
        id: { notIn: excludeIds },
        OR: [{ level: 'all' }, { level: userLevel }],
      },
    });

    if (candidates.length === 0) {
      candidates = await this.prisma.activityTemplate.findMany({
        where: {
          isActive: true,
          id: { notIn: excludeIds },
        },
      });
    }

    if (candidates.length === 0) {
      throw new BadRequestException('Không còn hoạt động thay thế khả dụng');
    }

    const newTemplate = candidates[Math.floor(Math.random() * candidates.length)];

    // Cập nhật DailyActivity
    const updated = await this.prisma.dailyActivity.update({
      where: { id },
      data: {
        templateId: newTemplate.id,
        completedAt: null,
      },
      include: { template: true },
    });

    // Cập nhật số lần swap
    const updatedSwap = await this.prisma.activityDailySwap.upsert({
      where: { userId_date: { userId, date: today } },
      create: {
        userId,
        date: today,
        count: 1,
      },
      update: {
        count: { increment: 1 },
      },
    });

    return {
      activity: updated,
      swapsRemaining: Math.max(0, 2 - updatedSwap.count),
    };
  }

  /**
   * 5. GET /activities/streak
   * Tính toán chuỗi ngày liên tiếp hoàn thành hoạt động.
   * Quy tắc:
   * - Ngày tính khi hoàn thành >= 1 việc
   * - Theo múi giờ Asia/Ho_Chi_Minh
   * - Hôm nay chưa hoàn thành không làm đứt chuỗi
   * - Bỏ lỡ 1 ngày trong quá khứ -> chuỗi về 0
   */
  async getStreak(userId: string): Promise<ActivityStreakResponse> {
    const today = this.getVietnamDate();
    const todayStr = this.getVietnamDateString(today);

    // Lấy toàn bộ các hoạt động đã hoàn thành của user
    const completedActivities = await this.prisma.dailyActivity.findMany({
      where: {
        userId,
        completedAt: { not: null },
      },
      select: {
        date: true,
      },
    });

    const completedDateSet = new Set<string>();
    for (const act of completedActivities) {
      completedDateSet.add(this.getVietnamDateString(act.date));
    }

    const isTodayCompleted = completedDateSet.has(todayStr);

    // Tính currentStreak
    let currentStreak = 0;
    if (isTodayCompleted) {
      currentStreak = 1;
      let checkDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      while (true) {
        const dStr = this.getVietnamDateString(checkDate);
        if (completedDateSet.has(dStr)) {
          currentStreak++;
          checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
        } else {
          break;
        }
      }
    } else {
      // Hôm nay chưa xong: không phá chuỗi -> bắt đầu xét từ hôm qua
      let checkDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      while (true) {
        const dStr = this.getVietnamDateString(checkDate);
        if (completedDateSet.has(dStr)) {
          currentStreak++;
          checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
        } else {
          break;
        }
      }
    }

    // Tính maxStreak trong lịch sử
    const sortedDates = Array.from(completedDateSet).sort();
    let maxStreak = 0;
    let tempStreak = 0;
    let prevDateTime: number | null = null;

    for (const dStr of sortedDates) {
      const dt = new Date(`${dStr}T00:00:00.000Z`).getTime();
      if (prevDateTime === null) {
        tempStreak = 1;
      } else {
        const diffDays = Math.round((dt - prevDateTime) / (24 * 60 * 60 * 1000));
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      prevDateTime = dt;
      if (tempStreak > maxStreak) {
        maxStreak = tempStreak;
      }
    }

    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
    }

    // Lấy lịch sử 30 ngày gần nhất để vẽ lịch / calendar
    const thirtyDaysAgo = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
    const recentActivities = await this.prisma.dailyActivity.findMany({
      where: {
        userId,
        date: { gte: thirtyDaysAgo },
      },
      select: {
        date: true,
        completedAt: true,
      },
    });

    const dayMap = new Map<string, { total: number; completed: number }>();
    for (const act of recentActivities) {
      const dStr = this.getVietnamDateString(act.date);
      const curr = dayMap.get(dStr) || { total: 0, completed: 0 };
      curr.total++;
      if (act.completedAt) curr.completed++;
      dayMap.set(dStr, curr);
    }

    const recentHistory: ActivityStreakResponse['recentHistory'] = [];
    for (let i = 29; i >= 0; i--) {
      const cur = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dStr = this.getVietnamDateString(cur);
      const stats = dayMap.get(dStr) || { total: 0, completed: 0 };
      recentHistory.push({
        date: dStr,
        total: stats.total,
        completed: stats.completed,
        isSuccess: stats.completed >= 1,
      });
    }

    return {
      currentStreak,
      maxStreak,
      isTodayCompleted,
      totalCompletedAllTime: completedActivities.length,
      recentHistory,
    };
  }
}
