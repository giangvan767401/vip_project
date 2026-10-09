import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EmotionLogsModule } from './emotion-logs/emotion-logs.module';
import { JournalEntriesModule } from './journal-entries/journal-entries.module';
import { AlertsModule } from './alerts/alerts.module';
import { ResourcesModule } from './resources/resources.module';
import { ConsentsModule } from './consents/consents.module';
import { MeModule } from './me/me.module';

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
    AlertsModule,
    ResourcesModule,
    ConsentsModule,
    MeModule,
  ],
})
export class AppModule {}

