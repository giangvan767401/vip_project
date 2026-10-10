import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const activities = [
  // PHYSICAL (Vận động & Cơ thể)
  {
    title: 'Đi bộ thư thả 10 phút',
    description: 'Rời bàn học, đi dạo một vòng quanh hành lang, sân trường hoặc khu trọ để máu huyết lưu thông.',
    category: 'PHYSICAL',
    level: 'all',
    durationMin: 10,
  },
  {
    title: 'Uống một ly nước ấm',
    description: 'Rót một cốc nước ấm, nhấp từng ngụm chậm rãi và cảm nhận cơ thể được tiếp thêm sinh lực.',
    category: 'PHYSICAL',
    level: 'all',
    durationMin: 2,
  },
  {
    title: 'Bài tập giãn cơ cổ và vai gáy',
    description: 'Xoay nhẹ khớp cổ sang hai bên, cuộn nhẹ vai ra sau 10 lần để giải phóng căng thẳng tích tụ.',
    category: 'PHYSICAL',
    level: 'nhe',
    durationMin: 5,
  },
  {
    title: 'Rửa mặt bằng nước mát',
    description: 'Vỗ nước mát lên mặt nhẹ nhàng để đánh thức các giác quan và hạ nhiệt cơn căng thẳng.',
    category: 'PHYSICAL',
    level: 'vua',
    durationMin: 3,
  },
  {
    title: 'Vận động nhẹ 15 phút',
    description: 'Tập bài cardio nhẹ hoặc nhảy theo điệu nhạc sôi động bạn yêu thích.',
    category: 'PHYSICAL',
    level: 'binh_thuong',
    durationMin: 15,
  },

  // MINDFUL (Tâm trí & Thư giãn)
  {
    title: 'Thở 4-7-8 điều hòa tâm trí',
    description: 'Hít vào bằng mũi 4 giây, giữ hơi 7 giây, thở ra chậm rãi bằng miệng 8 giây. Lặp lại 4 chu kỳ.',
    category: 'MINDFUL',
    level: 'all',
    durationMin: 3,
  },
  {
    title: 'Ngồi yên nhìn trời mây 5 phút',
    description: 'Tạm buông màn hình điện thoại/laptop, nhìn ra cửa sổ ngắm vòm lá hoặc những đám mây trôi.',
    category: 'MINDFUL',
    level: 'vua',
    durationMin: 5,
  },
  {
    title: 'Viết ra 3 điều nhỏ biết ơn hôm nay',
    description: 'Có thể là một bữa sáng ngon, một câu chào của bạn bè, hay đơn giản là một ngày có nắng ấm.',
    category: 'MINDFUL',
    level: 'all',
    durationMin: 5,
  },
  {
    title: 'Nghe 1 bản nhạc êm dịu không lời',
    description: 'Bật một bài lofi hoặc tiếng mưa rơi, nhắm mắt lại và chỉ tập trung vào giai điệu.',
    category: 'MINDFUL',
    level: 'nhe',
    durationMin: 5,
  },
  {
    title: 'Cho phép bản thân thả lỏng hoàn toàn',
    description: 'Chỉ cần nhắm mắt, tự nhủ: "Mình đã làm hết sức có thể cho hôm nay rồi, nghỉ ngơi thôi".',
    category: 'MINDFUL',
    level: 'keo_dai',
    durationMin: 3,
  },
  {
    title: 'Thiền chánh niệm 10 phút',
    description: 'Tập trung hoàn toàn vào luồng hơi thở đi vào và đi ra ở đầu mũi.',
    category: 'MINDFUL',
    level: 'binh_thuong',
    durationMin: 10,
  },

  // SOCIAL (Kết nối bạn bè & gia đình)
  {
    title: 'Nhắn tin hỏi thăm một người bạn',
    description: 'Gửi một chiếc meme hài hước hoặc một tin nhắn: "Dạo này cậu thế nào rồi?".',
    category: 'SOCIAL',
    level: 'all',
    durationMin: 5,
  },
  {
    title: 'Nói lời cảm ơn chân thành với ai đó',
    description: 'Cảm ơn bác bảo vệ, cô bán cơm, hoặc một người bạn đã giúp bạn một việc nhỏ.',
    category: 'SOCIAL',
    level: 'all',
    durationMin: 2,
  },
  {
    title: 'Gọi điện ngắn về cho người thân',
    description: 'Một cuộc gọi 5 phút về cho gia đình để nghe giọng nói quen thuộc và ấm áp.',
    category: 'SOCIAL',
    level: 'nhe',
    durationMin: 10,
  },
  {
    title: 'Mỉm cười hoặc vẫy tay chào ai đó',
    description: 'Một nụ cười nhẹ nhàng gửi đến người đối diện giúp cả hai cảm thấy dễ chịu hơn.',
    category: 'SOCIAL',
    level: 'vua',
    durationMin: 1,
  },
  {
    title: 'Lên lịch hẹn cà phê cuối tuần',
    description: 'Chủ động rủ một người bạn thân đi dạo hoặc ngồi cà phê tán gẫu vào cuối tuần.',
    category: 'SOCIAL',
    level: 'binh_thuong',
    durationMin: 10,
  },

  // CREATIVE (Sáng tạo & Học tập nhẹ)
  {
    title: 'Dọn sạch mặt bàn học',
    description: 'Gom rác, xếp lại sách vở và lau mặt bàn sạch sẽ. Không gian gọn gàng giúp tâm trí thông thoáng.',
    category: 'CREATIVE',
    level: 'all',
    durationMin: 5,
  },
  {
    title: 'Đọc 5 trang sách yêu thích',
    description: 'Mở cuốn sách bạn thích hoặc một tản văn nhẹ nhàng, đọc 5 trang để đổi nhịp suy nghĩ.',
    category: 'CREATIVE',
    level: 'nhe',
    durationMin: 10,
  },
  {
    title: 'Vẽ nguệch ngoạc hoặc viết tự do 3 phút',
    description: 'Cầm bút vẽ hoặc viết bất kỳ điều gì xuất hiện trong đầu ra giấy, không cần đẹp hay logic.',
    category: 'CREATIVE',
    level: 'vua',
    durationMin: 5,
  },
  {
    title: 'Lên to-do list 3 việc quan trọng nhất ngày mai',
    description: 'Chỉ chọn đúng 3 việc trọng tâm nhất, tránh tạo danh sách quá dài gây choáng ngợp.',
    category: 'CREATIVE',
    level: 'binh_thuong',
    durationMin: 5,
  },

  // SELF_CARE (Chăm sóc bản thân)
  {
    title: 'Chợp mắt ngắn 15 phút (Power nap)',
    description: 'Đặt báo thức 15 phút, nằm thả lỏng người để nạp lại pin cho não bộ sau giờ học căng thẳng.',
    category: 'SELF_CARE',
    level: 'all',
    durationMin: 15,
  },
  {
    title: 'Thưởng thức một món ăn nhẹ hoặc trái cây',
    description: 'Tận hưởng từng hương vị của một quả táo, hộp sữa chua hay chiếc bánh nhỏ mà không nhìn màn hình.',
    category: 'SELF_CARE',
    level: 'all',
    durationMin: 10,
  },
  {
    title: 'Ngâm chân hoặc tắm nước ấm thư giãn',
    description: 'Nước ấm giúp giải phóng cơ bắp, xua tan căng thẳng và hỗ trợ giấc ngủ ngon hơn.',
    category: 'SELF_CARE',
    level: 'nhe',
    durationMin: 15,
  },
  {
    title: 'Tắt màn hình trước khi ngủ 20 phút',
    description: 'Đặt điện thoại xa tầm tay, để mắt và não bộ được nghỉ ngơi tự nhiên trước khi chìm vào giấc ngủ.',
    category: 'SELF_CARE',
    level: 'vua',
    durationMin: 20,
  },
  {
    title: 'Ôm một chiếc gối ôm hoặc thú bông yêu thích',
    description: 'Cảm giác mềm mại, ấm áp từ chiếc gối ôm giúp hệ thần kinh cảm thấy an toàn và được che chở.',
    category: 'SELF_CARE',
    level: 'keo_dai',
    durationMin: 5,
  },
];

async function seedActivities() {
  console.log('🌱 Đang seed danh mục hoạt động nhỏ (ActivityTemplates)...');

  let count = 0;
  for (const act of activities) {
    const existing = await prisma.activityTemplate.findFirst({
      where: { title: act.title },
    });

    if (!existing) {
      await prisma.activityTemplate.create({
        data: act,
      });
      count++;
    }
  }

  const total = await prisma.activityTemplate.count();
  console.log(`✅ Đã thêm mới ${count} hoạt động. Tổng cộng hiện có: ${total} hoạt động mẫu.`);
}

seedActivities()
  .catch((e) => {
    console.error('❌ Lỗi khi seed hoạt động:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
