const request = require('supertest');
import { INestApplication } from '@nestjs/common';
import { createTestApp } from './helpers';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Session Briefs Flow (E2E) - Tạo → Gắn lịch hẹn → Counselor xem → Thu hồi/Hết hạn → 403', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let demoStudentToken: string;
  let demoStudentId: string;
  let counselor1Token: string;
  let counselor1Id: string;
  let counselor2Token: string;
  let testAppointmentId: string;
  let briefId: string;

  beforeAll(async () => {
    const context = await createTestApp();
    app = context.app;
    prisma = context.prisma;

    // Login demo student (có sẵn 28 ngày emotion logs)
    const sRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'demo@example.com', password: 'password123' })
      .expect(200);
    demoStudentToken = sRes.body.accessToken;
    demoStudentId = sRes.body.user.id;

    // Login counselor 1
    const c1Res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'counselor@example.com', password: 'password123' })
      .expect(200);
    counselor1Token = c1Res.body.accessToken;
    counselor1Id = c1Res.body.user.id;

    // Login counselor 2
    const c2Res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'counselor2@example.com', password: 'password123' })
      .expect(200);
    counselor2Token = c2Res.body.accessToken;

    // Tạo 1 cuộc hẹn mới để test brief (cách 5 ngày để không trùng seed)
    const startAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    const apptRes = await request(app.getHttpServer())
      .post('/appointments')
      .set('Authorization', `Bearer ${demoStudentToken}`)
      .send({
        counselorId: counselor1Id,
        startAt,
        note: 'Cuộc hẹn kiểm thử brief e2e',
      })
      .expect(201);
    testAppointmentId = apptRes.body.id;
  });

  afterAll(async () => {
    if (testAppointmentId) {
      await prisma.sessionBrief.deleteMany({ where: { appointmentId: testAppointmentId } });
      await prisma.appointment.deleteMany({ where: { id: testAppointmentId } });
    }
    await app.close();
  });

  it('1. Xem bản nháp tóm tắt tư vấn (POST /briefs/preview)', async () => {
    const res = await request(app.getHttpServer())
      .post('/briefs/preview')
      .set('Authorization', `Bearer ${demoStudentToken}`)
      .send({
        rangeDays: 7,
        sections: {
          includeTrend: true,
          includeNegativeDays: true,
          includeDifficultHours: true,
          includeActivities: true,
          includeJournalNotes: true,
        },
        userNote: 'Em muốn tập trung nói về áp lực ôn thi',
      })
      .expect(201);

    expect(res.body).toHaveProperty('snapshot');
    expect(res.body.snapshot).toHaveProperty('disclaimer');
    expect(res.body.snapshot).toHaveProperty('trend');
  });

  it('2. Gắn tóm tắt vào lịch hẹn của chính mình (POST /briefs)', async () => {
    const res = await request(app.getHttpServer())
      .post('/briefs')
      .set('Authorization', `Bearer ${demoStudentToken}`)
      .send({
        appointmentId: testAppointmentId,
        rangeDays: 7,
        sections: {
          includeTrend: true,
          includeNegativeDays: true,
          includeDifficultHours: true,
          includeActivities: true,
          includeJournalNotes: true,
        },
        userNote: 'Em muốn tập trung nói về áp lực ôn thi',
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.appointmentId).toBe(testAppointmentId);
    briefId = res.body.id;
  });

  it('3. Đúng Counselor của lịch hẹn xem được brief (200 OK)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/appointments/${testAppointmentId}/brief`)
      .set('Authorization', `Bearer ${counselor1Token}`)
      .expect(200);

    expect(res.body.appointmentId).toBe(testAppointmentId);
    expect(res.body.student.id).toBe(demoStudentId);
    expect(res.body.snapshot).toBeDefined();
  });

  it('4. Counselor khác không được phép xem brief của cuộc hẹn này (403 Forbidden)', async () => {
    await request(app.getHttpServer())
      .get(`/appointments/${testAppointmentId}/brief`)
      .set('Authorization', `Bearer ${counselor2Token}`)
      .expect(403);
  });

  it('5. Sinh viên thu hồi tóm tắt (DELETE /briefs/:id)', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/briefs/${briefId}`)
      .set('Authorization', `Bearer ${demoStudentToken}`)
      .expect(200);

    expect(res.body.revokedAt).not.toBeNull();
  });

  it('6. Counselor xem lại brief sau khi đã bị thu hồi → 403 Forbidden', async () => {
    await request(app.getHttpServer())
      .get(`/appointments/${testAppointmentId}/brief`)
      .set('Authorization', `Bearer ${counselor1Token}`)
      .expect(403);
  });
});
