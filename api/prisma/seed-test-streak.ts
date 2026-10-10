import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getVietnamDateString(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function getVietnamDate(d: Date = new Date()): Date {
  const dateStr = getVietnamDateString(d);
  return new Date(`${dateStr}T00:00:00.000Z`);
}

async function seedTestStreak() {
  console.log('🧪 Bắt đầu seed dữ liệu mẫu kiểm thử chuỗi streak (3 ngày liên tiếp)...');

  const demoUser = await prisma.user.findUnique({
    where: { email: 'demo@example.com' },
  });

  if (!demoUser) {
    console.error('❌ Không tìm thấy user demo@example.com. Hãy chạy `npm run seed` trước.');
    return;
  }

  const templates = await prisma.activityTemplate.findMany({
    take: 3,
  });

  if (templates.length === 0) {
    console.error('❌ Chưa có ActivityTemplate. Hãy chạy `npx ts-node prisma/seed-activities.ts` trước.');
    return;
  }

  const today = getVietnamDate();
  const day1 = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 ngày trước
  const day2 = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 ngày trước
  const day3 = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000); // hôm qua

  const testDays = [day1, day2, day3];

  for (const day of testDays) {
    const tmpl = templates[0];
    await prisma.dailyActivity.upsert({
      where: {
        userId_templateId_date: {
          userId: demoUser.id,
          templateId: tmpl.id,
          date: day,
        },
      },
      create: {
        userId: demoUser.id,
        templateId: tmpl.id,
        date: day,
        completedAt: new Date(day.getTime() + 8 * 60 * 60 * 1000), // hoàn thành lúc 8h sáng
      },
      update: {
        completedAt: new Date(day.getTime() + 8 * 60 * 60 * 1000),
      },
    });
  }

  console.log('✅ Đã seed thành công 3 ngày hoàn thành liên tiếp (hôm kia, hôm kìa, hôm qua):');
  console.log(`   - Ngày 1: ${getVietnamDateString(day1)} (đã xong)`);
  console.log(`   - Ngày 2: ${getVietnamDateString(day2)} (đã xong)`);
  console.log(`   - Ngày 3: ${getVietnamDateString(day3)} (đã xong)`);
  console.log(`   - Hôm nay: ${getVietnamDateString(today)} (chưa tick) -> Streak hiện tại sẽ là 3!`);
  console.log(`   - Khi tick hoàn thành 1 việc hôm nay -> Streak sẽ tăng lên 4!`);
}

seedTestStreak()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
