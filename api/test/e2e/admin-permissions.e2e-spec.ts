const request = require('supertest');
import { INestApplication } from '@nestjs/common';
import { createTestApp } from './helpers';

describe('Admin Permissions (E2E) - Rule: Admin không đọc được cảm xúc/nhật ký/tin nhắn/brief', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    const context = await createTestApp();
    app = context.app;

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'password123' })
      .expect(200);

    adminToken = res.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('Admin không được xem emotion-logs cá nhân (403)', async () => {
    await request(app.getHttpServer())
      .get('/emotion-logs')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(403);
  });

  it('Admin không được xem emotion summary (403)', async () => {
    await request(app.getHttpServer())
      .get('/emotion-logs/summary')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(403);
  });

  it('Admin không được xem nhật ký (403)', async () => {
    await request(app.getHttpServer())
      .get('/journal-entries')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(403);
  });

  it('Admin không được xem danh sách cuộc trò chuyện (403)', async () => {
    await request(app.getHttpServer())
      .get('/conversations')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(403);
  });

  it('Admin không được preview brief (403)', async () => {
    await request(app.getHttpServer())
      .post('/briefs/preview')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ rangeDays: 7 })
      .expect(403);
  });

  it('Admin không được xem brief của lịch hẹn (403)', async () => {
    await request(app.getHttpServer())
      .get('/appointments/cmv224ng3003kvmigbkiroinf/brief')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(403);
  });
});
