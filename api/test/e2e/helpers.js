"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestApp = createTestApp;
exports.cleanupTestUsers = cleanupTestUsers;
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const app_module_1 = require("../../src/app.module");
const http_exception_filter_1 = require("../../src/common/filters/http-exception.filter");
const prisma_service_1 = require("../../src/prisma/prisma.service");
async function createTestApp() {
    const moduleRef = await testing_1.Test.createTestingModule({
        imports: [app_module_1.AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    await app.init();
    const prisma = app.get(prisma_service_1.PrismaService);
    return { app, prisma };
}
async function cleanupTestUsers(prisma, emails) {
    for (const email of emails) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user)
            continue;
        await prisma.sessionBrief.deleteMany({ where: { userId: user.id } });
        await prisma.appointment.deleteMany({
            where: { OR: [{ userId: user.id }, { counselorId: user.id }] },
        });
        await prisma.message.deleteMany({ where: { senderId: user.id } });
        await prisma.conversation.deleteMany({
            where: { OR: [{ userId: user.id }, { counselorId: user.id }] },
        });
        await prisma.dailyActivity.deleteMany({ where: { userId: user.id } });
        await prisma.activityDailySwap.deleteMany({ where: { userId: user.id } });
        await prisma.consentShare.deleteMany({
            where: { OR: [{ userId: user.id }, { counselorId: user.id }] },
        });
        await prisma.journalEntry.deleteMany({ where: { userId: user.id } });
        await prisma.emotionLog.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
    }
}
//# sourceMappingURL=helpers.js.map