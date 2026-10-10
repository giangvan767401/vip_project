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

  // 1.1 Seed các tài khoản Tư vấn viên (Counselors)
  const counselorsData = [
    {
      email: 'counselor@example.com',
      fullName: 'ThS. Nguyễn Văn Tâm (Chuyên gia Tâm lý học đường)',
    },
    {
      email: 'counselor2@example.com',
      fullName: 'TS. Trần Thị Mai (Trung tâm Hỗ trợ Sinh viên)',
    },
  ];

  for (const c of counselorsData) {
    const counselor = await prisma.user.upsert({
      where: { email: c.email },
      update: {
        fullName: c.fullName,
        role: Role.COUNSELOR,
      },
      create: {
        email: c.email,
        fullName: c.fullName,
        password: hashedPassword,
        role: Role.COUNSELOR,
      },
    });
    console.log(`🧑‍⚕️ Counselor: ${counselor.fullName} (${counselor.email})`);
  }

  // 1.2 Seed tài khoản Quản trị viên (Admin)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      fullName: 'Quản trị viên Hệ thống',
      role: Role.ADMIN,
      isActive: true,
    },
    create: {
      email: 'admin@example.com',
      fullName: 'Quản trị viên Hệ thống',
      password: hashedPassword,
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log(`🛡️ Admin: ${adminUser.fullName} (${adminUser.email})`);

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
    // ── TUẦN 4 TRƯỚC (Ngày -27 đến -21): Tinh thần rất tốt, hào hứng, tích cực ──
    {
      dayOffset: 27,
      sessions: [
        { emotion: 'Happy', positiveScore: 88.0, negativeScore: 5.0, scores: { Happy: 88.0, Neutral: 7.0, Sad: 5.0 }, hour: 9 },
      ],
      journal: { mood: 5, note: 'Khởi đầu học kỳ mới tràn đầy năng lượng, gặp lại bạn bè vui vẻ.' }
    },
    {
      dayOffset: 26,
      sessions: [
        { emotion: 'Happy', positiveScore: 84.0, negativeScore: 7.0, scores: { Happy: 84.0, Neutral: 9.0, Sad: 7.0 }, hour: 14 },
      ],
    },
    {
      dayOffset: 25,
      sessions: [
        { emotion: 'Neutral', positiveScore: 65.0, negativeScore: 12.0, scores: { Neutral: 65.0, Happy: 23.0, Sad: 12.0 }, hour: 10 },
      ],
      journal: { mood: 4, note: 'Buổi học trên giảng đường khá thú vị, mình đã kịp ghi chép đầy đủ.' }
    },
    {
      dayOffset: 24,
      sessions: [
        { emotion: 'Happy', positiveScore: 80.0, negativeScore: 8.0, scores: { Happy: 80.0, Neutral: 12.0, Sad: 8.0 }, hour: 15 },
      ],
    },
    {
      dayOffset: 23,
      sessions: [
        { emotion: 'Happy', positiveScore: 78.0, negativeScore: 10.0, scores: { Happy: 78.0, Neutral: 12.0, Sad: 10.0 }, hour: 11 },
      ],
      journal: { mood: 4, note: 'Đi ăn tối cùng nhóm bạn thân, cười rất nhiều và cảm thấy thoải mái.' }
    },
    {
      dayOffset: 22,
      sessions: [
        { emotion: 'Neutral', positiveScore: 60.0, negativeScore: 15.0, scores: { Neutral: 60.0, Happy: 25.0, Sad: 15.0 }, hour: 16 },
      ],
    },
    {
      dayOffset: 21,
      sessions: [
        { emotion: 'Happy', positiveScore: 82.0, negativeScore: 6.0, scores: { Happy: 82.0, Neutral: 12.0, Sad: 6.0 }, hour: 10 },
      ],
      journal: { mood: 4, note: 'Cuối tuần nghỉ ngơi, dọn dẹp phòng và chuẩn bị cho tuần tiếp theo.' }
    },

    // ── TUẦN 3 TRƯỚC (Ngày -20 đến -14): Khối lượng học tăng, bắt đầu xuất hiện áp lực nhẹ ──
    {
      dayOffset: 20,
      sessions: [
        { emotion: 'Neutral', positiveScore: 55.0, negativeScore: 22.0, scores: { Neutral: 55.0, Happy: 23.0, Sad: 22.0 }, hour: 9 },
      ],
      journal: { mood: 3, note: 'Bắt đầu nhận đề tài đồ án lớn, nhìn yêu cầu thấy khá nhiều việc cần làm.' }
    },
    {
      dayOffset: 19,
      sessions: [
        { emotion: 'Happy', positiveScore: 70.0, negativeScore: 18.0, scores: { Happy: 70.0, Neutral: 12.0, Sad: 18.0 }, hour: 14 },
      ],
    },
    {
      dayOffset: 18,
      sessions: [
        { emotion: 'Neutral', positiveScore: 50.0, negativeScore: 28.0, scores: { Neutral: 50.0, Sad: 28.0, Happy: 22.0 }, hour: 15 },
      ],
      journal: { mood: 3, note: 'Họp nhóm đồ án lần 1, mọi người chưa thống nhất được hướng đi nên hơi sốt ruột.' }
    },
    {
      dayOffset: 17,
      sessions: [
        { emotion: 'Neutral', positiveScore: 52.0, negativeScore: 25.0, scores: { Neutral: 52.0, Happy: 23.0, Sad: 25.0 }, hour: 11 },
      ],
    },
    {
      dayOffset: 16,
      sessions: [
        { emotion: 'Sad', positiveScore: 35.0, negativeScore: 48.0, scores: { Sad: 48.0, Neutral: 35.0, Fear: 17.0 }, hour: 20 },
      ],
      journal: { mood: 2, note: 'Tối nay ngồi sửa lỗi code mãi không xong, bắt đầu thấy hơi căng thẳng.' }
    },
    {
      dayOffset: 15,
      sessions: [
        { emotion: 'Happy', positiveScore: 68.0, negativeScore: 20.0, scores: { Happy: 68.0, Neutral: 12.0, Sad: 20.0 }, hour: 10 },
      ],
      journal: { mood: 3, note: 'May mắn tìm được giải pháp sửa lỗi, thở phào nhẹ nhõm.' }
    },
    {
      dayOffset: 14,
      sessions: [
        { emotion: 'Neutral', positiveScore: 48.0, negativeScore: 32.0, scores: { Neutral: 48.0, Sad: 32.0, Happy: 20.0 }, hour: 16 },
      ],
    },

    // ── TUẦN 2 TRƯỚC (Ngày -13 đến -7): Áp lực deadline tăng cao, bắt đầu mệt mỏi và mất ngủ ──
    {
      dayOffset: 13,
      sessions: [
        { emotion: 'Sad', positiveScore: 28.0, negativeScore: 55.0, scores: { Sad: 55.0, Neutral: 28.0, Fear: 17.0 }, hour: 11 },
      ],
      journal: { mood: 2, note: 'Điểm kiểm tra giữa kỳ thấp hơn mong đợi rất nhiều, cảm thấy hoang mang.' }
    },
    {
      dayOffset: 12,
      sessions: [
        { emotion: 'Fear', positiveScore: 20.0, negativeScore: 65.0, scores: { Fear: 65.0, Sad: 20.0, Neutral: 15.0 }, hour: 14 },
      ],
      journal: { mood: 2, note: 'Deadline cận kề mà tiến độ nhóm quá chậm, lo lắng không kịp nộp bài.' }
    },
    {
      dayOffset: 11,
      sessions: [
        { emotion: 'Neutral', positiveScore: 40.0, negativeScore: 45.0, scores: { Neutral: 40.0, Sad: 45.0, Fear: 15.0 }, hour: 10 },
      ],
    },
    {
      dayOffset: 10,
      sessions: [
        { emotion: 'Sad', positiveScore: 22.0, negativeScore: 62.0, scores: { Sad: 62.0, Fear: 20.0, Neutral: 16.0 }, hour: 21 },
      ],
      journal: { mood: 2, note: 'Đêm qua chỉ ngủ được 4 tiếng, người lúc nào cũng đờ đẫn và mệt mỏi.' }
    },
    {
      dayOffset: 9,
      sessions: [
        { emotion: 'Sad', positiveScore: 25.0, negativeScore: 58.0, scores: { Sad: 58.0, Neutral: 25.0, Angry: 17.0 }, hour: 15 },
      ],
    },
    {
      dayOffset: 8,
      sessions: [
        { emotion: 'Fear', positiveScore: 18.0, negativeScore: 68.0, scores: { Fear: 68.0, Sad: 18.0, Neutral: 14.0 }, hour: 11 },
      ],
      journal: { mood: 2, note: 'Cảm giác quá tải, không biết bắt đầu từ đâu, chỉ muốn nằm một chỗ.' }
    },
    {
      dayOffset: 7,
      sessions: [
        { emotion: 'Sad', positiveScore: 20.0, negativeScore: 60.0, scores: { Sad: 60.0, Fear: 25.0, Neutral: 15.0 }, hour: 16 },
      ],
    },

    // ── TUẦN 1 GẦN ĐÂY (Ngày -6 đến 0): CHUỖI TIÊU CỰC KÉO DÀI LIÊN TIẾP (Kích hoạt cảnh báo Kéo dài) ──
    // Ngày -6: Sad vượt ngưỡng
    {
      dayOffset: 6,
      sessions: [
        { emotion: 'Sad', positiveScore: 12.0, negativeScore: 78.5, scores: { Sad: 78.5, Angry: 9.5, Neutral: 12.0 }, note: 'Thức khuya làm bài, điểm kiểm tra không như ý', hour: 10 },
        { emotion: 'Sad', positiveScore: 15.0, negativeScore: 72.0, scores: { Sad: 72.0, Fear: 13.0, Neutral: 15.0 }, hour: 20 },
      ],
      journal: { mood: 1, note: 'Kết quả bài thi giữa kỳ quá tệ, mình cảm thấy rất thất vọng về bản thân.' }
    },
    // Ngày -5: Fear cao độ
    {
      dayOffset: 5,
      sessions: [
        { emotion: 'Fear', positiveScore: 8.0, negativeScore: 85.0, scores: { Fear: 85.0, Sad: 7.0, Neutral: 8.0 }, note: 'Áp lực deadline đồ án dồn dập', hour: 14 },
      ],
      journal: { mood: 1, note: 'Áp lực đè nặng, sợ không qua môn. Cả ngày không nuốt nổi cơm.' }
    },
    // Ngày -4: Sad kiệt sức
    {
      dayOffset: 4,
      sessions: [
        { emotion: 'Sad', positiveScore: 10.0, negativeScore: 82.0, scores: { Sad: 82.0, Fear: 8.0, Neutral: 10.0 }, hour: 11 },
        { emotion: 'Sad', positiveScore: 14.0, negativeScore: 76.0, scores: { Sad: 76.0, Angry: 10.0, Neutral: 14.0 }, hour: 21 },
      ],
      journal: { mood: 1, note: 'Liên tục mất ngủ, đầu óc căng thẳng và kiệt sức.' }
    },
    // Ngày -3: Angry xung đột
    {
      dayOffset: 3,
      sessions: [
        { emotion: 'Angry', positiveScore: 5.0, negativeScore: 89.0, scores: { Angry: 89.0, Sad: 6.0, Neutral: 5.0 }, note: 'Bất đồng ý kiến gay gắt với nhóm', hour: 15 },
      ],
      journal: { mood: 1, note: 'Xung đột với bạn cùng nhóm, bực bội và mệt mỏi cùng cực.' }
    },
    // Ngày -2: Sad bế tắc
    {
      dayOffset: 2,
      sessions: [
        { emotion: 'Sad', positiveScore: 14.0, negativeScore: 75.0, scores: { Sad: 75.0, Neutral: 11.0, Fear: 14.0 }, hour: 12 },
      ],
      journal: { mood: 2, note: 'Vẫn cảm thấy u ám, muốn buông xuôi mọi thứ.' }
    },
    // Ngày -1: Fear / Căng thẳng tiếp tục
    {
      dayOffset: 1,
      sessions: [
        { emotion: 'Fear', positiveScore: 15.0, negativeScore: 70.0, scores: { Fear: 70.0, Sad: 15.0, Neutral: 15.0 }, note: 'Cố gắng thử thở 4-7-8 nhưng tâm trí vẫn rất bồn chồn', hour: 16 },
      ],
      journal: { mood: 2, note: 'Mình nhận ra mình cần sự trợ giúp từ chuyên viên tư vấn của trường.' }
    },
    // Ngày 0 (Hôm nay): Tiêu cực cao, cần trợ giúp
    {
      dayOffset: 0,
      sessions: [
        { emotion: 'Sad', positiveScore: 18.0, negativeScore: 68.0, scores: { Sad: 68.0, Neutral: 18.0, Fear: 14.0 }, hour: 10 },
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

  // 4. Seed DailyActivity hoàn thành rải rác trong 28 ngày
  const templates = await prisma.activityTemplate.findMany({ take: 6 });
  if (templates.length > 0) {
    await prisma.dailyActivity.deleteMany({ where: { userId: user.id } });
    const activityOffsets = [25, 22, 19, 15, 12, 8, 5, 2, 0];
    for (let idx = 0; idx < activityOffsets.length; idx++) {
      const offset = activityOffsets[idx];
      const actDate = new Date(now.getTime() - offset * 24 * 60 * 60 * 1000);
      const tmpl = templates[idx % templates.length];
      await prisma.dailyActivity.create({
        data: {
          userId: user.id,
          templateId: tmpl.id,
          date: actDate,
          completedAt: new Date(actDate.getTime() + 10 * 60 * 60 * 1000),
        },
      });
    }
    console.log(`🏃 Đã seed ${activityOffsets.length} hoạt động hoàn thành trong 28 ngày`);
  }

  // 5. Seed lịch hẹn và user chưa đủ dữ liệu cho Module 15 (Briefs)
  const counselor1 = await prisma.user.findUnique({ where: { email: 'counselor@example.com' } });
  if (counselor1) {
    await prisma.sessionBrief.deleteMany({ where: { userId: user.id } });
    await prisma.appointment.deleteMany({ where: { userId: user.id } });

    // Tạo lịch hẹn CONFIRMED cho demo@example.com
    const apptDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const demoAppt = await prisma.appointment.create({
      data: {
        userId: user.id,
        counselorId: counselor1.id,
        startAt: apptDate,
        status: 'CONFIRMED',
        note: 'Em muốn trao đổi về áp lực học tập và mất ngủ gần đây ạ.',
      },
    });
    console.log(`📅 Lịch hẹn demo: ID=${demoAppt.id} với ${counselor1.fullName}`);

    // Tạo lịch hẹn CANCELLED để test
    const cancelledAppt = await prisma.appointment.create({
      data: {
        userId: user.id,
        counselorId: counselor1.id,
        startAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: 'CANCELLED',
        note: 'Lịch hẹn đã hủy.',
      },
    });
    console.log(`📅 Lịch hẹn CANCELLED demo: ID=${cancelledAppt.id}`);
  }

  // User mới chỉ có 2 ngày dữ liệu
  const shortUser = await prisma.user.upsert({
    where: { email: 'short_user@example.com' },
    update: { fullName: 'Sinh viên Mới (Chưa đủ 7 ngày)', password: hashedPassword, role: Role.USER },
    create: { email: 'short_user@example.com', fullName: 'Sinh viên Mới (Chưa đủ 7 ngày)', password: hashedPassword, role: Role.USER },
  });
  await prisma.emotionLog.deleteMany({ where: { userId: shortUser.id } });
  await prisma.emotionLog.createMany({
    data: [
      { userId: shortUser.id, emotion: 'Neutral', positiveScore: 50, negativeScore: 20, createdAt: new Date() },
      { userId: shortUser.id, emotion: 'Happy', positiveScore: 70, negativeScore: 10, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    ],
  });
  console.log(`👤 User mới (chưa đủ 7 ngày): short_user@example.com / password123`);

  console.log(`✅ Seed thành công:`);
  console.log(`   - ${logCount} bản ghi EmotionLog (28 ngày, xu hướng xấu dần và kích hoạt cảnh báo kéo dài)`);
  console.log(`   - ${journalCount} bài viết JournalEntry`);
  console.log(`   - 3 AlertRules và 6 Resources`);
  console.log(`   - User login: demo@example.com / password123`);
  console.log(`   - User login (<7 ngày): short_user@example.com / password123`);
  console.log(`   - Counselor login: counselor@example.com / password123, counselor2@example.com / password123`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
