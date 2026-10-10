import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBriefPreviewDto } from './dto/create-brief-preview.dto';
import { CreateBriefDto } from './dto/create-brief.dto';
import { SectionsDto } from './dto/sections.dto';
import { AppointmentStatus, Role } from '@prisma/client';
import type { Response } from 'express';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';

export interface SnapshotData {
  rangeDays: number;
  dateFrom: string;
  dateTo: string;
  generatedAt: string;
  disclaimer: string;
  userNote?: string;
  trend?: {
    avgPositiveScore: number;
    avgNegativeScore: number;
    dominantEmotion: string;
    totalCheckIns: number;
    dailyStats: {
      date: string;
      avgPositive: number;
      avgNegative: number;
      dominantEmotion: string;
      checkInCount: number;
    }[];
  };
  negativeDays?: {
    totalEvaluatedDays: number;
    negativeDaysCount: number;
    negativeRatioPercent: number;
    description: string;
  };
  difficultHours?: {
    slots: {
      slotName: string;
      timeRange: string;
      checkInCount: number;
      avgNegativeScore: number;
      negativeCount: number;
    }[];
    mostDifficultSlot: string;
    recommendation: string;
  };
  activities?: {
    totalCompleted: number;
    items: {
      title: string;
      category: string;
      completedDate: string;
    }[];
  };
  journalNotes?: {
    date: string;
    mood: number;
    noteSnippet: string;
  }[];
}

@Injectable()
export class BriefsService {
  constructor(private readonly prisma: PrismaService) {}

  // Dựng dữ liệu snapshot bằng quy tắc & thống kê
  async generateSnapshotData(
    userId: string,
    rangeDays: number,
    sections: SectionsDto = {},
    userNote?: string,
  ): Promise<SnapshotData> {
    const safeRange = rangeDays && rangeDays >= 7 ? rangeDays : 7;
    const now = new Date();
    const startDate = new Date(now.getTime() - safeRange * 24 * 60 * 60 * 1000);

    // 1. Lấy EmotionLog trong khoảng thời gian
    const logs = await this.prisma.emotionLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Gom theo ngày (định dạng YYYY-MM-DD theo giờ VN)
    const logsByDay = new Map<string, typeof logs>();
    for (const log of logs) {
      const dateKey = new Date(log.createdAt.getTime() + 7 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      const existing = logsByDay.get(dateKey) || [];
      existing.push(log);
      logsByDay.set(dateKey, existing);
    }

    // Yêu cầu: Báo "chưa đủ dữ liệu" nếu < 7 ngày
    if (logsByDay.size < 7) {
      throw new BadRequestException(
        `Chưa đủ dữ liệu: Cần ít nhất 7 ngày ghi nhận cảm xúc để tạo tóm tắt buổi tư vấn (hiện có ${logsByDay.size} ngày).`,
      );
    }

    const snapshot: SnapshotData = {
      rangeDays: safeRange,
      dateFrom: startDate.toISOString().slice(0, 10),
      dateTo: now.toISOString().slice(0, 10),
      generatedAt: now.toISOString(),
      disclaimer:
        'Dữ liệu do sinh viên chọn chia sẻ từ nhật ký cá nhân để hỗ trợ trao đổi với chuyên viên tư vấn. Không phải kết luận chẩn đoán y khoa.',
    };

    if (userNote?.trim()) {
      snapshot.userNote = userNote.trim();
    }

    // 2. Xu hướng ngày (trend)
    if (sections.includeTrend !== false) {
      const dailyStats: NonNullable<SnapshotData['trend']>['dailyStats'] = [];
      let totalPositive = 0;
      let totalNegative = 0;
      const emotionCounts: Record<string, number> = {};

      const sortedDates = Array.from(logsByDay.keys()).sort();
      for (const d of sortedDates) {
        const dayLogs = logsByDay.get(d)!;
        const sumPos = dayLogs.reduce((acc, l) => acc + l.positiveScore, 0);
        const sumNeg = dayLogs.reduce((acc, l) => acc + l.negativeScore, 0);
        const dayEmotionCounts: Record<string, number> = {};

        for (const l of dayLogs) {
          dayEmotionCounts[l.emotion] = (dayEmotionCounts[l.emotion] || 0) + 1;
          emotionCounts[l.emotion] = (emotionCounts[l.emotion] || 0) + 1;
        }

        let dayDominant = 'Neutral';
        let maxCount = 0;
        for (const [em, cnt] of Object.entries(dayEmotionCounts)) {
          if (cnt > maxCount) {
            maxCount = cnt;
            dayDominant = em;
          }
        }

        dailyStats.push({
          date: d,
          avgPositive: Number((sumPos / dayLogs.length).toFixed(1)),
          avgNegative: Number((sumNeg / dayLogs.length).toFixed(1)),
          dominantEmotion: dayDominant,
          checkInCount: dayLogs.length,
        });

        totalPositive += sumPos;
        totalNegative += sumNeg;
      }

      let overallDominant = 'Neutral';
      let overallMaxCount = 0;
      for (const [em, cnt] of Object.entries(emotionCounts)) {
        if (cnt > overallMaxCount) {
          overallMaxCount = cnt;
          overallDominant = em;
        }
      }

      snapshot.trend = {
        avgPositiveScore: Number((totalPositive / logs.length).toFixed(1)),
        avgNegativeScore: Number((totalNegative / logs.length).toFixed(1)),
        dominantEmotion: overallDominant,
        totalCheckIns: logs.length,
        dailyStats,
      };
    }

    // 3. Số ngày tiêu cực (negativeDays)
    if (sections.includeNegativeDays !== false) {
      let negativeDaysCount = 0;
      for (const [, dayLogs] of logsByDay) {
        const sumNeg = dayLogs.reduce((acc, l) => acc + l.negativeScore, 0);
        const avgNeg = sumNeg / dayLogs.length;
        if (avgNeg >= 50) {
          negativeDaysCount++;
        }
      }

      const totalEvaluatedDays = logsByDay.size;
      const ratio = Number(((negativeDaysCount / totalEvaluatedDays) * 100).toFixed(1));

      snapshot.negativeDays = {
        totalEvaluatedDays,
        negativeDaysCount,
        negativeRatioPercent: ratio,
        description:
          negativeDaysCount > 0
            ? `Có ${negativeDaysCount}/${totalEvaluatedDays} ngày (${ratio}%) điểm tiêu cực vượt ngưỡng trung bình.`
            : `Tâm trạng ổn định, không có ngày nào vượt ngưỡng tiêu cực trung bình trong giai đoạn này.`,
      };
    }

    // 4. Khung giờ khó nhất (difficultHours)
    if (sections.includeDifficultHours !== false) {
      const slotDefs = [
        { slotName: 'Đêm muộn', timeRange: '22:00 - 05:59', minHour: 22, maxHour: 5 },
        { slotName: 'Sáng', timeRange: '06:00 - 11:59', minHour: 6, maxHour: 11 },
        { slotName: 'Chiều', timeRange: '12:00 - 17:59', minHour: 12, maxHour: 17 },
        { slotName: 'Tối', timeRange: '18:00 - 21:59', minHour: 18, maxHour: 21 },
      ];

      const slotResults = slotDefs.map((def) => {
        const slotLogs = logs.filter((l) => {
          const h = (l.createdAt.getUTCHours() + 7) % 24;
          if (def.slotName === 'Đêm muộn') {
            return h >= 22 || h < 6;
          }
          return h >= def.minHour && h <= def.maxHour;
        });

        const checkInCount = slotLogs.length;
        const avgNegativeScore =
          checkInCount > 0
            ? Number(
                (
                  slotLogs.reduce((acc, l) => acc + l.negativeScore, 0) /
                  checkInCount
                ).toFixed(1),
              )
            : 0;

        const negativeEmotions = ['Sad', 'Fear', 'Angry', 'Disgust'];
        const negativeCount = slotLogs.filter((l) =>
          negativeEmotions.includes(l.emotion),
        ).length;

        return {
          slotName: def.slotName,
          timeRange: def.timeRange,
          checkInCount,
          avgNegativeScore,
          negativeCount,
        };
      });

      // Tìm slot có điểm tiêu cực cao nhất (ưu tiên slot có check-in)
      const sortedSlots = [...slotResults].sort(
        (a, b) => b.avgNegativeScore - a.avgNegativeScore,
      );
      const hardest = sortedSlots[0] && sortedSlots[0].checkInCount > 0
        ? sortedSlots[0].slotName + ` (${sortedSlots[0].timeRange})`
        : 'Chưa xác định khung giờ căng thẳng rõ rệt';

      snapshot.difficultHours = {
        slots: slotResults,
        mostDifficultSlot: hardest,
        recommendation:
          'Khung giờ này thường có điểm căng thẳng/tiêu cực cao hơn, gợi ý trao đổi cùng chuyên viên về nhịp sinh hoạt hoặc áp lực trong khoảng thời gian này.',
      };
    }

    // 5. Hoạt động & bài tập đã làm (activities)
    if (sections.includeActivities !== false) {
      const completedActivities = await this.prisma.dailyActivity.findMany({
        where: {
          userId,
          date: { gte: startDate },
          completedAt: { not: null },
        },
        include: { template: true },
        orderBy: { date: 'desc' },
      });

      snapshot.activities = {
        totalCompleted: completedActivities.length,
        items: completedActivities.map((a) => ({
          title: a.template.title,
          category: a.template.category,
          completedDate: a.date.toISOString().slice(0, 10),
        })),
      };
    }

    // 6. Trích đoạn nhật ký (journalNotes)
    if (sections.includeJournalNotes !== false) {
      const journals = await this.prisma.journalEntry.findMany({
        where: {
          userId,
          date: { gte: startDate },
        },
        orderBy: { date: 'desc' },
        take: 10,
      });

      snapshot.journalNotes = journals.map((j) => ({
        date: j.date.toISOString().slice(0, 10),
        mood: j.mood,
        noteSnippet: j.note ? j.note.slice(0, 150) + (j.note.length > 150 ? '...' : '') : '',
      }));
    }

    return snapshot;
  }

  // POST /briefs/preview
  async preview(userId: string, dto: CreateBriefPreviewDto) {
    const rangeDays = dto.rangeDays || 7;
    const sections = dto.sections || new SectionsDto();
    const snapshot = await this.generateSnapshotData(
      userId,
      rangeDays,
      sections,
      dto.userNote,
    );

    return {
      rangeDays,
      sections,
      userNote: dto.userNote || null,
      snapshot,
    };
  }

  // POST /briefs - Gắn brief vào lịch hẹn
  async create(userId: string, dto: CreateBriefDto) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
      include: { sessionBrief: true },
    });

    if (!appointment) {
      throw new NotFoundException('Không tìm thấy lịch hẹn');
    }

    if (appointment.userId !== userId) {
      throw new ForbiddenException('Bạn chỉ có thể gắn tóm tắt vào lịch hẹn của chính mình');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Lịch hẹn đã bị hủy, không thể gắn tóm tắt');
    }

    if (appointment.sessionBrief) {
      throw new ConflictException('Lịch hẹn này đã có tóm tắt tư vấn');
    }

    const rangeDays = dto.rangeDays || 7;
    const sections = dto.sections || new SectionsDto();

    // Dựng snapshot đóng băng tại thời điểm xác nhận
    const snapshot = await this.generateSnapshotData(
      userId,
      rangeDays,
      sections,
      dto.userNote,
    );

    // Tính expiresAt = giờ kết thúc hẹn + 7 ngày (buổi hẹn tính 45 phút)
    const sessionEndTime = new Date(appointment.startAt.getTime() + 45 * 60 * 1000);
    const expiresAt = new Date(sessionEndTime.getTime() + 7 * 24 * 60 * 60 * 1000);

    return this.prisma.sessionBrief.create({
      data: {
        userId,
        appointmentId: dto.appointmentId,
        rangeDays,
        sections: sections as any,
        userNote: dto.userNote?.trim() ? dto.userNote.trim() : null,
        snapshot: snapshot as any,
        expiresAt,
      },
      include: {
        appointment: {
          select: {
            id: true,
            startAt: true,
            status: true,
            counselor: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  // DELETE /briefs/:id - Sinh viên thu hồi ngay
  async revoke(userId: string, briefId: string) {
    const brief = await this.prisma.sessionBrief.findUnique({
      where: { id: briefId },
    });

    if (!brief) {
      throw new NotFoundException('Không tìm thấy tóm tắt tư vấn');
    }

    if (brief.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền thu hồi tóm tắt này');
    }

    if (brief.revokedAt) {
      return brief;
    }

    return this.prisma.sessionBrief.update({
      where: { id: briefId },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  // GET /appointments/:id/brief - Counselor xem brief của đúng lịch hẹn
  async getBriefForCounselor(counselorId: string, appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        sessionBrief: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Không tìm thấy lịch hẹn');
    }

    // Chỉ đúng Counselor của lịch hẹn mới được xem (403 nếu sai)
    if (appointment.counselorId !== counselorId) {
      throw new ForbiddenException('Bạn không phải chuyên viên tư vấn của lịch hẹn này');
    }

    if (!appointment.sessionBrief) {
      throw new NotFoundException('Lịch hẹn này chưa có bản tóm tắt tư vấn');
    }

    const brief = appointment.sessionBrief;

    // Hết hạn hoặc đã thu hồi thì Counselor bị chặn ngay (403)
    if (brief.revokedAt) {
      throw new ForbiddenException('Tóm tắt tư vấn này đã bị sinh viên thu hồi quyền truy cập');
    }

    if (new Date() > brief.expiresAt) {
      throw new ForbiddenException('Tóm tắt tư vấn này đã hết thời hạn truy cập');
    }

    // CHỈ trả về dữ liệu snapshot và thông tin brief, không mở thêm quyền truy vấn ngoài snapshot
    return {
      id: brief.id,
      appointmentId: appointment.id,
      student: appointment.user,
      startAt: appointment.startAt,
      rangeDays: brief.rangeDays,
      userNote: brief.userNote,
      snapshot: brief.snapshot,
      expiresAt: brief.expiresAt,
      createdAt: brief.createdAt,
      disclaimer:
        'Dữ liệu do sinh viên tự nguyện chọn chia sẻ, chỉ dùng hỗ trợ buổi trao đổi. Không phải kết luận chẩn đoán y khoa.',
    };
  }

  // GET /briefs/:id/pdf - Xuất PDF cho chính user
  async generatePdf(userId: string, briefId: string, res: Response) {
    const brief = await this.prisma.sessionBrief.findUnique({
      where: { id: briefId },
      include: {
        user: { select: { fullName: true, email: true } },
        appointment: {
          include: {
            counselor: { select: { fullName: true, email: true } },
          },
        },
      },
    });

    if (!brief) {
      throw new NotFoundException('Không tìm thấy tóm tắt tư vấn');
    }

    if (brief.userId !== userId) {
      throw new ForbiddenException('Bạn chỉ có thể xuất PDF bản tóm tắt của chính mình');
    }

    const snapshot = brief.snapshot as unknown as SnapshotData;

    // Cấu hình PDFDocument
    const doc = new (PDFDocument as any)({
      margin: 40,
      size: 'A4',
    });

    // Cài đặt font tiếng Việt (hỗ trợ Windows Arial hoặc DejaVuSans fallback)
    const fontRegular = 'C:\\Windows\\Fonts\\arial.ttf';
    const fontBold = 'C:\\Windows\\Fonts\\arialbd.ttf';
    const hasUnicodeFont = fs.existsSync(fontRegular) && fs.existsSync(fontBold);

    if (hasUnicodeFont) {
      doc.registerFont('MainFont', fontRegular);
      doc.registerFont('MainFont-Bold', fontBold);
      doc.font('MainFont');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="mindlog-session-brief-${brief.id}.pdf"`,
    );

    doc.pipe(res);

    // 1. Tiêu đề
    if (hasUnicodeFont) doc.font('MainFont-Bold');
    doc.fontSize(18).fillColor('#1E293B').text('MINDLOG - BẢN TÓM TẮT BUỔI TƯ VẤN', {
      align: 'center',
    });
    doc.moveDown(0.3);

    if (hasUnicodeFont) doc.font('MainFont');
    doc.fontSize(10).fillColor('#64748B').text(
      'Tài liệu tự chuẩn bị cho buổi tham vấn tâm lý sinh viên',
      { align: 'center' },
    );
    doc.moveDown(1);

    // 2. Thông tin chung
    doc.roundedRect(40, doc.y, 515, 85, 4).fillAndStroke('#F8FAFC', '#E2E8F0');
    const startY = doc.y + 10;

    if (hasUnicodeFont) doc.font('MainFont-Bold');
    doc.fontSize(10).fillColor('#334155').text(`Sinh viên: `, 55, startY);
    if (hasUnicodeFont) doc.font('MainFont');
    doc.fillColor('#0F172A').text(`${brief.user.fullName} (${brief.user.email})`, 130, startY);

    if (hasUnicodeFont) doc.font('MainFont-Bold');
    doc.fillColor('#334155').text(`Chuyên viên: `, 55, startY + 18);
    if (hasUnicodeFont) doc.font('MainFont');
    doc.fillColor('#0F172A').text(
      `${brief.appointment.counselor.fullName} (${brief.appointment.counselor.email})`,
      130,
      startY + 18,
    );

    if (hasUnicodeFont) doc.font('MainFont-Bold');
    doc.fillColor('#334155').text(`Thời gian hẹn: `, 55, startY + 36);
    if (hasUnicodeFont) doc.font('MainFont');
    doc.fillColor('#0F172A').text(
      new Date(brief.appointment.startAt).toLocaleString('vi-VN'),
      130,
      startY + 36,
    );

    if (hasUnicodeFont) doc.font('MainFont-Bold');
    doc.fillColor('#334155').text(`Thời hạn xem: `, 55, startY + 54);
    if (hasUnicodeFont) doc.font('MainFont');
    doc.fillColor('#EF4444').text(
      `${new Date(brief.expiresAt).toLocaleDateString('vi-VN')} (Tự động khóa sau 7 ngày)`,
      130,
      startY + 54,
    );

    doc.y = startY + 80;
    doc.moveDown(1);

    // 3. Ghi chú của sinh viên (nếu có)
    if (snapshot.userNote) {
      if (hasUnicodeFont) doc.font('MainFont-Bold');
      doc.fontSize(12).fillColor('#0284C7').text('1. Điều mình muốn chia sẻ trước với chuyên viên:');
      doc.moveDown(0.3);
      if (hasUnicodeFont) doc.font('MainFont');
      doc.fontSize(10).fillColor('#1E293B').text(snapshot.userNote, { indent: 15 });
      doc.moveDown(1);
    }

    // 4. Xu hướng cảm xúc (nếu mục này được bật)
    if (snapshot.trend) {
      if (hasUnicodeFont) doc.font('MainFont-Bold');
      doc.fontSize(12).fillColor('#0284C7').text(`2. Xu hướng cảm xúc (${snapshot.rangeDays} ngày gần nhất):`);
      doc.moveDown(0.3);
      if (hasUnicodeFont) doc.font('MainFont');
      doc.fontSize(10).fillColor('#1E293B').text(
        `• Điểm tích cực trung bình: ${snapshot.trend.avgPositiveScore}% | Điểm tiêu cực trung bình: ${snapshot.trend.avgNegativeScore}%`,
        { indent: 15 },
      );
      doc.text(
        `• Cảm xúc chủ đạo: ${snapshot.trend.dominantEmotion} (Tổng số phiên check-in: ${snapshot.trend.totalCheckIns})`,
        { indent: 15 },
      );
      doc.moveDown(1);
    }

    // 5. Số ngày tiêu cực (nếu mục này được bật)
    if (snapshot.negativeDays) {
      if (hasUnicodeFont) doc.font('MainFont-Bold');
      doc.fontSize(12).fillColor('#0284C7').text('3. Mức độ căng thẳng / Số ngày tiêu cực:');
      doc.moveDown(0.3);
      if (hasUnicodeFont) doc.font('MainFont');
      doc.fontSize(10).fillColor('#1E293B').text(`• ${snapshot.negativeDays.description}`, { indent: 15 });
      doc.moveDown(1);
    }

    // 6. Khung giờ khó nhất (nếu mục này được bật)
    if (snapshot.difficultHours) {
      if (hasUnicodeFont) doc.font('MainFont-Bold');
      doc.fontSize(12).fillColor('#0284C7').text('4. Khung giờ dễ cảm thấy quá tải nhất:');
      doc.moveDown(0.3);
      if (hasUnicodeFont) doc.font('MainFont');
      doc.fontSize(10).fillColor('#1E293B').text(
        `• Khung giờ căng thẳng nhất: ${snapshot.difficultHours.mostDifficultSlot}`,
        { indent: 15 },
      );
      doc.fontSize(9).fillColor('#64748B').text(
        `(${snapshot.difficultHours.recommendation})`,
        { indent: 15 },
      );
      doc.moveDown(1);
    }

    // 7. Hoạt động & bài tập đã làm (nếu mục này được bật)
    if (snapshot.activities) {
      if (hasUnicodeFont) doc.font('MainFont-Bold');
      doc.fontSize(12).fillColor('#0284C7').text('5. Hoạt động & bài tập đã thực hiện:');
      doc.moveDown(0.3);
      if (hasUnicodeFont) doc.font('MainFont');
      doc.fontSize(10).fillColor('#1E293B').text(
        `• Tổng số bài tập/hoạt động hoàn thành: ${snapshot.activities.totalCompleted}`,
        { indent: 15 },
      );
      for (const act of snapshot.activities.items.slice(0, 5)) {
        doc.fontSize(9).fillColor('#475569').text(
          `  - [${act.completedDate}] ${act.title} (${act.category})`,
          { indent: 20 },
        );
      }
      doc.moveDown(1);
    }

    // 8. Trích đoạn nhật ký (nếu mục này được bật)
    if (snapshot.journalNotes && snapshot.journalNotes.length > 0) {
      if (hasUnicodeFont) doc.font('MainFont-Bold');
      doc.fontSize(12).fillColor('#0284C7').text('6. Trích đoạn nhật ký tự ghi:');
      doc.moveDown(0.3);
      for (const j of snapshot.journalNotes.slice(0, 5)) {
        if (hasUnicodeFont) doc.font('MainFont-Bold');
        doc.fontSize(9).fillColor('#334155').text(`  • Ngày ${j.date} (Tâm trạng: ${j.mood}/5):`, { indent: 15 });
        if (hasUnicodeFont) doc.font('MainFont');
        doc.fontSize(9).fillColor('#475569').text(`    "${j.noteSnippet}"`, { indent: 20 });
      }
      doc.moveDown(1);
    }

    // 9. Disclaimer ở chân trang
    doc.moveDown(1);
    doc.strokeColor('#CBD5E1').lineWidth(0.5).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);
    if (hasUnicodeFont) doc.font('MainFont');
    doc.fontSize(8).fillColor('#94A3B8').text(
      `Miễn trừ trách nhiệm: ${snapshot.disclaimer}`,
      { align: 'center', width: 515 },
    );

    doc.end();
  }
}
