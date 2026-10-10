const request = require('supertest');
import { INestApplication } from '@nestjs/common';
import { createTestApp, cleanupTestUsers } from './helpers';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Daily Activities Flow (E2E) - Nhận việc → Tick → Chuỗi ngày đúng', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const studentEmail = `student_act_${Date.now()}@example.com`;
  let studentToken: string;
  let activityId: string;

  beforeAll(async () => {
    const context = await createTestApp();
    app = context.app;
    prisma = context.prisma;

    // Register test student
    const sRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: studentEmail,
        password: 'password123',
        fullName: 'Sinh Viên Hoạt Động',
      })
      .expect(201);
    studentToken = sRes.body.accessToken;
  });

  afterAll(async () => {
    await cleanupTestUsers(prisma, [studentEmail]);
    await app.close();
  });

  it('1. Nhận danh sách hoạt động nhỏ hôm nay (GET /activities/today)', async () => {
    const res = await request(app.getHttpServer())
      .get('/activities/today')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('activities');
    expect(res.body.activities.length).toBeGreaterThanOrEqual(3);
    activityId = res.body.activities[0].id;
  });

  it('2. Trước khi tick, streak hôm nay là 0', async () => {
    const res = await request(app.getHttpServer())
      .get('/activities/streak')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(res.body.isTodayCompleted).toBe(false);
    expect(res.body.currentStreak).toBe(0);
  });

  it('3. Tick hoàn thành 1 hoạt động (POST /activities/:id/complete)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/activities/${activityId}/complete`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(201);

    expect(res.body.id).toBe(activityId);
    expect(res.body.completedAt).not.toBeNull();
  });

  it('4. Sau khi tick, streak hôm nay tăng lên 1 và isTodayCompleted = true', async () => {
    const res = await request(app.getHttpServer())
      .get('/activities/streak')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(res.body.isTodayCompleted).toBe(true);
    expect(res.body.currentStreak).toBe(1);
  });

  it('5. Bỏ tick hoàn thành (DELETE /activities/:id/complete) thì chuỗi trở về 0', async () => {
    await request(app.getHttpServer())
      .delete(`/activities/${activityId}/complete`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    const res = await request(app.getHttpServer())
      .get('/activities/streak')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(res.body.isTodayCompleted).toBe(false);
    expect(res.body.currentStreak).toBe(0);
  });
});
