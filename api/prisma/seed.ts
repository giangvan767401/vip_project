import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu giả MindLog...');

  const demoEmail = 'demo@example.com';
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Tạo hoặc cập nhật user demo
  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {
      fullName: 'Sinh viên Demo',
      password: hashedPassword,
      role: Role.USER,
    },
    create: {
      email: demoEmail,
      fullName: 'Sinh viên Demo',
      password: hashedPassword,
      role: Role.USER,
    },
  });

  console.log(`👤 User demo: ${user.email} (ID: ${user.id})`);

  // Xóa dữ liệu cũ của user demo để tránh trùng lặp khi chạy lại seed
  await prisma.emotionLog.deleteMany({ where: { userId: user.id } });
  await prisma.journalEntry.deleteMany({ where: { userId: user.id } });

  const now = new Date();
  
  // Dữ liệu mô phỏng 16 ngày (từ 15 ngày trước đến hôm nay)
  // Trong đó từ ngày -9 đến ngày -5 (5 ngày liên tiếp) là chuỗi tiêu cực (Sad/Fear/Angry)
  interface DayTemplate {
    dayOffset: number;
    sessions: {
      emotion: string;
      positiveScore: number;
      negativeScore: number;
      scores: Record<string, number>;
      note?: string;
      hour: number;
    }[];
    journal?: {
      mood: number;
      note: string;
    };
  }

  const daysData: DayTemplate[] = [
    // Ngày -15 đến -7: Thời gian trước đó
    {
      dayOffset: 15,
      sessions: [
        { emotion: 'Happy', positiveScore: 82.5, negativeScore: 6.2, scores: { Happy: 82.5, Neutral: 11.3, Sad: 6.2 }, hour: 9 },
      ],
      journal: { mood: 4, note: 'Khởi đầu tuần mới khá suôn sẻ, chuẩn bị cho đồ án.' }
    },
    {
      dayOffset: 14,
      sessions: [
        { emotion: 'Neutral', positiveScore: 55.0, negativeScore: 20.0, scores: { Neutral: 55.0, Happy: 25.0, Sad: 20.0 }, hour: 14 },
      ],
    },
    {
      dayOffset: 13,
      sessions: [
        { emotion: 'Happy', positiveScore: 88.0, negativeScore: 4.5, scores: { Happy: 88.0, Neutral: 7.5, Sad: 4.5 }, hour: 10 },
      ],
    },
    {
      dayOffset: 12,
      sessions: [
        { emotion: 'Neutral', positiveScore: 60.0, negativeScore: 18.0, scores: { Neutral: 60.0, Happy: 22.0, Sad: 18.0 }, hour: 11 },
      ],
    },
    {
      dayOffset: 11,
      sessions: [
        { emotion: 'Happy', positiveScore: 78.0, negativeScore: 12.0, scores: { Happy: 78.0, Neutral: 10.0, Sad: 12.0 }, hour: 15 },
      ],
    },
    {
      dayOffset: 10,
      sessions: [
        { emotion: 'Neutral', positiveScore: 52.0, negativeScore: 25.0, scores: { Neutral: 52.0, Happy: 23.0, Sad: 25.0 }, hour: 16 },
      ],
    },
    {
      dayOffset: 9,
      sessions: [
        { emotion: 'Happy', positiveScore: 75.0, negativeScore: 15.0, scores: { Happy: 75.0, Neutral: 10.0, Sad: 15.0 }, hour: 10 },
      ],
    },
    {
      dayOffset: 8,
      sessions: [
        { emotion: 'Neutral', positiveScore: 58.0, negativeScore: 22.0, scores: { Neutral: 58.0, Happy: 20.0, Sad: 22.0 }, hour: 14 },
      ],
    },
    {
      dayOffset: 7,
      sessions: [
        { emotion: 'Neutral', positiveScore: 50.0, negativeScore: 30.0, scores: { Neutral: 50.0, Happy: 20.0, Sad: 30.0 }, hour: 11 },
      ],
    },

    // --- CHUỖI TIÊU CỰC LIÊN TIẾP 5 NGÀY TRONG 7 NGÀY GẦN ĐÂY (Ngày -6 đến Ngày -2) ---
    // Ngày -6: Tiêu cực 1 (Sad)
    {
      dayOffset: 6,
      sessions: [
        { emotion: 'Sad', positiveScore: 12.0, negativeScore: 78.5, scores: { Sad: 78.5, Angry: 9.5, Neutral: 12.0 }, note: 'Thức khuya làm bài, điểm kiểm tra không như ý', hour: 10 },
        { emotion: 'Sad', positiveScore: 15.0, negativeScore: 72.0, scores: { Sad: 72.0, Fear: 13.0, Neutral: 15.0 }, hour: 20 },
      ],
      journal: { mood: 2, note: 'Kết quả bài thi giữa kỳ quá tệ, mình cảm thấy rất thất vọng về bản thân.' }
    },
    // Ngày -5: Tiêu cực 2 (Fear/Sad)
    {
      dayOffset: 5,
      sessions: [
        { emotion: 'Fear', positiveScore: 8.0, negativeScore: 85.0, scores: { Fear: 85.0, Sad: 7.0, Neutral: 8.0 }, note: 'Áp lực deadline đồ án dồn dập', hour: 14 },
      ],
      journal: { mood: 1, note: 'Áp lực đè nặng, sợ không qua môn. Cả ngày không nuốt nổi cơm.' }
    },
    // Ngày -4: Tiêu cực 3 (Sad)
    {
      dayOffset: 4,
      sessions: [
        { emotion: 'Sad', positiveScore: 10.0, negativeScore: 82.0, scores: { Sad: 82.0, Fear: 8.0, Neutral: 10.0 }, hour: 11 },
        { emotion: 'Sad', positiveScore: 14.0, negativeScore: 76.0, scores: { Sad: 76.0, Angry: 10.0, Neutral: 14.0 }, hour: 21 },
      ],
      journal: { mood: 1, note: 'Liên tục mất ngủ, đầu óc căng thẳng và kiệt sức.' }
    },
    // Ngày -3: Tiêu cực 4 (Angry / Căng thẳng tột độ)
    {
      dayOffset: 3,
      sessions: [
        { emotion: 'Angry', positiveScore: 5.0, negativeScore: 89.0, scores: { Angry: 89.0, Sad: 6.0, Neutral: 5.0 }, note: 'Bất đồng ý kiến gay gắt với nhóm', hour: 15 },
      ],
      journal: { mood: 1, note: 'Xung đột với bạn cùng nhóm, bực bội và mệt mỏi cùng cực.' }
    },
    // Ngày -2: Tiêu cực 5 (Sad kéo dài)
    {
      dayOffset: 2,
      sessions: [
        { emotion: 'Sad', positiveScore: 14.0, negativeScore: 75.0, scores: { Sad: 75.0, Neutral: 11.0, Fear: 14.0 }, hour: 12 },
      ],
      journal: { mood: 2, note: 'Vẫn cảm thấy u ám, muốn buông xuôi mọi thứ.' }
    },
    // --- KẾT THÚC CHUỖI 5 NGÀY TIÊU CỰC ---

    // Ngày -1 (hôm qua): Bắt đầu check-in có dấu hiệu bình tâm lại
    {
      dayOffset: 1,
      sessions: [
        { emotion: 'Neutral', positiveScore: 45.0, negativeScore: 42.0, scores: { Neutral: 45.0, Sad: 42.0, Happy: 13.0 }, note: 'Tập thở 4-7-8 và nói chuyện với bạn', hour: 16 },
      ],
      journal: { mood: 3, note: 'Được bạn an ủi và hướng dẫn bài tập thở, nhẹ nhõm hơn đôi chút.' }
    },
    // Ngày 0 (hôm nay): Check-in gần nhất
    {
      dayOffset: 0,
      sessions: [
        { emotion: 'Neutral', positiveScore: 48.0, negativeScore: 38.0, scores: { Neutral: 48.0, Happy: 22.0, Sad: 38.0 }, hour: 10 },
      ],
    },
  ];

  let logCount = 0;
  let journalCount = 0;

  for (const day of daysData) {
    const targetDate = new Date(now.getTime() - day.dayOffset * 24 * 60 * 60 * 1000);

    for (const session of day.sessions) {
      const sessionStart = new Date(targetDate);
      sessionStart.setHours(session.hour, 15, 0, 0);
      const sessionEnd = new Date(sessionStart.getTime() + 8000); // 8 giây checkin

      await prisma.emotionLog.create({
        data: {
          userId: user.id,
          emotion: session.emotion,
          positiveScore: session.positiveScore,
          negativeScore: session.negativeScore,
          scores: session.scores,
          startedAt: sessionStart,
          endedAt: sessionEnd,
          note: session.note ?? null,
          createdAt: sessionEnd,
        },
      });
      logCount++;
    }

    if (day.journal) {
      const journalDate = new Date(targetDate);
      journalDate.setHours(21, 0, 0, 0);

      await prisma.journalEntry.create({
        data: {
          userId: user.id,
          mood: day.journal.mood,
          note: day.journal.note,
          date: journalDate,
          createdAt: journalDate,
          updatedAt: journalDate,
        },
      });
      journalCount++;
    }
  }

  // 2. Seed AlertRule
  await prisma.alertRule.deleteMany();
  await prisma.alertRule.createMany({
    data: [
      {
        name: 'Mặc định: Cảnh báo chuỗi tiêu cực mức vừa (≥4/7 ngày)',
        negativeThreshold: 50.0,
        consecutiveDays: 4,
        timeWindowDays: 7,
        level: 'vua',
        isActive: true,
      },
      {
        name: 'Cảnh báo tiêu cực mức nhẹ (≥2/7 ngày)',
        negativeThreshold: 45.0,
        consecutiveDays: 2,
        timeWindowDays: 7,
        level: 'nhe',
        isActive: true,
      },
      {
        name: 'Cảnh báo tiêu cực kéo dài nguy cơ cao (≥6/7 ngày)',
        negativeThreshold: 55.0,
        consecutiveDays: 6,
        timeWindowDays: 7,
        level: 'keo_dai',
        isActive: true,
      },
    ],
  });

  // 3. Seed Resource (Tài liệu, bài tập, hotline)
  await prisma.resource.deleteMany();
  await prisma.resource.createMany({
    data: [
      {
        title: 'Bài tập thở 4-7-8 xoa dịu hệ thần kinh',
        description: 'Kỹ thuật thở sâu khoa học giúp giảm nhịp tim, xoa dịu lo âu và tái tạo sự thư thái trong 5 phút.',
        type: 'EXERCISE',
        level: 'all',
        content: 'Hít vào bằng mũi trong 4 giây -> Giữ hơi thở trong 7 giây -> Thở ra từ từ bằng miệng trong 8 giây.',
        url: '/student/breathing',
        durationMinutes: 5,
      },
      {
        title: 'Kỹ thuật tiếp đất 5-4-3-2-1 cắt đứt cơn hoảng loạn',
        description: 'Phương pháp định thần nhanh bằng 5 giác quan khi bạn cảm thấy quá tải hoặc căng thẳng tột độ.',
        type: 'EXERCISE',
        level: 'vua',
        content: 'Nhận diện: 5 vật nhìn thấy, 4 thứ có thể chạm, 3 âm thanh nghe được, 2 mùi hương ngửi thấy, 1 vị giác cảm nhận.',
        url: '/student/journal',
        durationMinutes: 8,
      },
      {
        title: 'Cẩm nang quản lý áp lực học tập và đồ án',
        description: 'Bí quyết chia nhỏ mục tiêu, kiểm soát chứng trì hoãn và duy trì động lực tích cực.',
        type: 'ARTICLE',
        level: 'nhe',
        content: 'Khi gặp khó khăn, hãy chia nhỏ deadline thành từng mốc 25 phút (kỹ thuật Pomodoro) và cho phép bản thân nghỉ ngơi.',
        durationMinutes: 10,
      },
      {
        title: 'Phòng Tham vấn Tâm lý Sinh viên',
        description: 'Chuyên viên tâm lý trường đại học sẵn sàng lắng nghe và đồng hành bảo mật cùng bạn.',
        type: 'HOTLINE',
        level: 'keo_dai',
        content: 'Hotline tham vấn: 1900 1234 (8:00 - 17:30 Thứ 2 đến Thứ 6). Đặt lịch hẹn qua ứng dụng hoặc phòng A102.',
      },
      {
        title: 'Tổng đài Quốc gia 111 (Miễn cước 24/7)',
        description: 'Đường dây nóng hỗ trợ tư vấn bảo vệ tâm lý thanh thiếu niên khẩn cấp hoạt động 24/7.',
        type: 'HOTLINE',
        level: 'all',
        content: 'Gọi trực tiếp miễn phí 111 - Hoạt động liên tục 24/7 trong cả nước.',
      },
      {
        title: 'Đường dây nóng Ngày Mai (Hỗ trợ người trầm cảm)',
        description: 'Hỗ trợ tâm lý nhân văn, lắng nghe không phán xét từ các tình nguyện viên được đào tạo.',
        type: 'HOTLINE',
        level: 'vua',
        content: 'Hotline: 096 306 1414 (13:00 - 20:30 tất cả các ngày trong tuần).',
      },
    ],
  });

  console.log(`✅ Seed thành công:`);
  console.log(`   - ${logCount} bản ghi EmotionLog (16 ngày, gồm chuỗi 5 ngày tiêu cực liên tiếp)`);
  console.log(`   - ${journalCount} bài viết JournalEntry`);
  console.log(`   - 3 AlertRules và 6 Resources`);
  console.log(`   - User login: demo@example.com / password123`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
