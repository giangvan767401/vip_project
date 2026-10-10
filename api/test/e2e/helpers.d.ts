import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
export declare function createTestApp(): Promise<{
    app: INestApplication;
    prisma: PrismaService;
}>;
export declare function cleanupTestUsers(prisma: PrismaService, emails: string[]): Promise<void>;
