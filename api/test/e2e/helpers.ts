import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { PrismaService } from '../../src/prisma/prisma.service';

export async function createTestApp(): Promise<{ app: INestApplication; prisma: PrismaService }> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  const prisma = app.get(PrismaService);
  return { app, prisma };
}

export async function cleanupTestUsers(prisma: PrismaService, emails: string[]) {
  for (const email of emails) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) continue;

    // Delete related records where user might be referenced as counselor or sender
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
