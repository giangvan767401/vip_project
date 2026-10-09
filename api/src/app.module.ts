import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EmotionLogsModule } from './emotion-logs/emotion-logs.module';
import { JournalEntriesModule } from './journal-entries/journal-entries.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    PrismaModule,
    AuthModule,
    EmotionLogsModule,
    JournalEntriesModule,
  ],
})
export class AppModule {}
