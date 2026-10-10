"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require('supertest');
const helpers_1 = require("./helpers");
describe('Emotion, Consent & Alert Flow (E2E) - Đăng ký → Check-in → Dashboard → Cảnh báo → Chia sẻ → Counselor xem → Thu hồi → 403', () => {
    let app;
    let prisma;
    const testStudentEmail = `test_student_${Date.now()}@example.com`;
    let studentToken;
    let studentId;
    let counselorToken;
    let counselorId;
    let consentId;
    beforeAll(async () => {
        const context = await (0, helpers_1.createTestApp)();
        app = context.app;
        prisma = context.prisma;
        const cRes = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'counselor@example.com', password: 'password123' })
            .expect(200);
        counselorToken = cRes.body.accessToken;
        counselorId = cRes.body.user.id;
    });
    afterAll(async () => {
        await (0, helpers_1.cleanupTestUsers)(prisma, [testStudentEmail]);
        await app.close();
    });
    it('1. Đăng ký tài khoản sinh viên mới', async () => {
        const res = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
            email: testStudentEmail,
            password: 'password123',
            fullName: 'Sinh Viên Test E2E',
        })
            .expect(201);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body.user).toHaveProperty('id');
        studentToken = res.body.accessToken;
        studentId = res.body.user.id;
    });
    it('2. Check-in cảm xúc', async () => {
        const now = new Date();
        const tenSecsAgo = new Date(now.getTime() - 10000);
        const res = await request(app.getHttpServer())
            .post('/emotion-logs')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({
            emotion: 'buon',
            positiveScore: 10,
            negativeScore: 80,
            startedAt: tenSecsAgo.toISOString(),
            endedAt: now.toISOString(),
            note: 'Cảm thấy rất áp lực bài vở hôm nay',
            scores: { buon: 0.8, vui: 0.1 },
        })
            .expect(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.emotion).toBe('buon');
        expect(res.body.userId).toBe(studentId);
    });
    it('3. Xem dashboard summary cảm xúc', async () => {
        const res = await request(app.getHttpServer())
            .get('/emotion-logs/summary?range=week')
            .set('Authorization', `Bearer ${studentToken}`)
            .expect(200);
        expect(res.body).toHaveProperty('summary');
        expect(res.body.summary).toHaveProperty('totalCheckIns');
        expect(res.body.summary.totalCheckIns).toBeGreaterThanOrEqual(1);
    });
    it('4. Kiểm tra cảnh báo cá nhân (/alerts/me)', async () => {
        const res = await request(app.getHttpServer())
            .get('/alerts/me')
            .set('Authorization', `Bearer ${studentToken}`)
            .expect(200);
        expect(res.body).toHaveProperty('level');
    });
    it('5. Chia sẻ dữ liệu cho Counselor', async () => {
        const res = await request(app.getHttpServer())
            .post('/consents')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({ counselorId })
            .expect(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.status).toBe('ACTIVE');
        consentId = res.body.id;
    });
    it('6. Counselor xem danh sách và xem chi tiết sinh viên vừa chia sẻ', async () => {
        const clientsRes = await request(app.getHttpServer())
            .get('/counselor/clients')
            .set('Authorization', `Bearer ${counselorToken}`)
            .expect(200);
        const clientFound = clientsRes.body.find((c) => c.student.id === studentId);
        expect(clientFound).toBeDefined();
        const summaryRes = await request(app.getHttpServer())
            .get(`/counselor/clients/${studentId}/summary`)
            .set('Authorization', `Bearer ${counselorToken}`)
            .expect(200);
        expect(summaryRes.body.student.id).toBe(studentId);
        expect(summaryRes.body.summary).toBeDefined();
    });
    it('7. Sinh viên thu hồi quyền chia sẻ', async () => {
        const res = await request(app.getHttpServer())
            .delete(`/consents/${consentId}`)
            .set('Authorization', `Bearer ${studentToken}`)
            .expect(200);
        expect(res.body.status).toBe('REVOKED');
    });
    it('8. Counselor truy cập lại dữ liệu sinh viên sau thu hồi → 403 Forbidden', async () => {
        await request(app.getHttpServer())
            .get(`/counselor/clients/${studentId}/summary`)
            .set('Authorization', `Bearer ${counselorToken}`)
            .expect(403);
    });
});
//# sourceMappingURL=emotion-consent-alert.e2e-spec.js.map