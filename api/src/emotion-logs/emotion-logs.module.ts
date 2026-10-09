import { forwardRef, Module } from '@nestjs/common';
import { EmotionLogsController } from './emotion-logs.controller';
import { EmotionLogsService } from './emotion-logs.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AlertsModule } from '../alerts/alerts.module';
import { CounselorModule } from '../counselor/counselor.module';

@Module({
  imports: [
    PrismaModule,
    AlertsModule,
    forwardRef(() => CounselorModule),
  ],
  controllers: [EmotionLogsController],
  providers: [EmotionLogsService],
  exports: [EmotionLogsService],
})
export class EmotionLogsModule {}
