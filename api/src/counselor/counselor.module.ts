import { forwardRef, Module } from '@nestjs/common';
import { CounselorService } from './counselor.service';
import { CounselorController } from './counselor.controller';
import { CounselorGateway } from './counselor.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { EmotionLogsModule } from '../emotion-logs/emotion-logs.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({}),
    forwardRef(() => EmotionLogsModule),
    AlertsModule,
  ],
  controllers: [CounselorController],
  providers: [CounselorService, CounselorGateway],
  exports: [CounselorService, CounselorGateway],
})
export class CounselorModule {}
