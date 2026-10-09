import { Module } from '@nestjs/common';
import { EmotionLogsController } from './emotion-logs.controller';
import { EmotionLogsService } from './emotion-logs.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EmotionLogsController],
  providers: [EmotionLogsService],
  exports: [EmotionLogsService],
})
export class EmotionLogsModule {}
