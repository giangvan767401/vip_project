const request = require('supertest');
import { INestApplication } from '@nestjs/common';
import { createTestApp, cleanupTestUsers } from './helpers';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Conversations Flow (E2E) - Gửi yêu cầu → Counselor chấp nhận → Nhắn qua lại → Đóng → Không gửi được; Người ngoài → 403', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const studentEmail = `student_conv_${Date.now()}@example.com`;
  const outsiderEmail = `outsider_conv_${Date.now()}@example.com`;

  let studentToken: string;
  let studentId: string;
  let counselorToken: string;
  let counselorId: string;
  let outsiderToken: string;
  let conversationId: string;

  beforeAll(async () => {
    const context = await createTestApp();
    app = context.app;
    prisma = context.prisma;

    // Login counselor
    const cRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'counselor@example.com', password: 'password123' })
      .expect(200);
    counselorToken = cRes.body.accessToken;
    counselorId = cRes.body.user.id;

    // Register student
    const sRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: studentEmail,
        password: 'password123',
        fullName: 'Sinh Viên Chat',
      })
      .expect(201);
    studentToken = sRes.body.accessToken;
    studentId = sRes.body.user.id;

    // Register outsider
    const oRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: outsiderEmail,
        password: 'password123',
        fullName: 'Người Ngoài Chat',
      })
      .expect(201);
    outsiderToken = oRes.body.accessToken;
  });

  afterAll(async () => {
    await cleanupTestUsers(prisma, [studentEmail, outsiderEmail]);
    await app.close();
  });

  it('1. Sinh viên gửi yêu cầu trò chuyện tới Counselor', async () => {
    const res = await request(app.getHttpServer())
      .post('/conversations')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ counselorId })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.status).toBe('PENDING');
    conversationId = res.body.id;
  });

  it('2. Chưa được chấp nhận (PENDING) thì không gửi được tin nhắn', async () => {
    await request(app.getHttpServer())
      .post(`/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ content: 'Xin chào cô' })
      .expect(400);
  });

  it('3. Counselor chấp nhận yêu cầu trò chuyện (chuyển sang ACTIVE)', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/conversations/${conversationId}`)
      .set('Authorization', `Bearer ${counselorToken}`)
      .send({ status: 'ACTIVE' })
      .expect(200);

    expect(res.body.status).toBe('ACTIVE');
  });

  it('4. Hai bên gửi tin nhắn qua lại thành công', async () => {
    // Sinh viên gửi
    const res1 = await request(app.getHttpServer())
      .post(`/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ content: 'Chào thầy/cô, em cảm thấy hơi căng thẳng ạ' })
      .expect(201);
    expect(res1.body.content).toBe('Chào thầy/cô, em cảm thấy hơi căng thẳng ạ');

    // Counselor gửi trả lời
    const res2 = await request(app.getHttpServer())
      .post(`/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${counselorToken}`)
      .send({ content: 'Chào em, thầy đã nhận được tin nhắn. Em có thể chia sẻ thêm không?' })
      .expect(201);
    expect(res2.body.content).toBe('Chào em, thầy đã nhận được tin nhắn. Em có thể chia sẻ thêm không?');

    // Kiểm tra danh sách tin nhắn
    const msgListRes = await request(app.getHttpServer())
      .get(`/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    expect(msgListRes.body.messages.length).toBeGreaterThanOrEqual(2);
  });

  it('5. Người ngoài truy cập hoặc gửi tin nhắn vào cuộc trò chuyện → 403 Forbidden', async () => {
    // Người ngoài đọc tin nhắn
    await request(app.getHttpServer())
      .get(`/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(403);

    // Người ngoài gửi tin nhắn
    await request(app.getHttpServer())
      .post(`/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({ content: 'Tôi là người ngoài tò mò' })
      .expect(403);
  });

  it('6. Đóng cuộc trò chuyện (CLOSED)', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/conversations/${conversationId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ status: 'CLOSED' })
      .expect(200);

    expect(res.body.status).toBe('CLOSED');
  });

  it('7. Sau khi đóng cuộc trò chuyện, không thể gửi thêm tin nhắn (400 Bad Request)', async () => {
    await request(app.getHttpServer())
      .post(`/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ content: 'Em nhắn thêm sau khi đóng' })
      .expect(400);
  });
});
