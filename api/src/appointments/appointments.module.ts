import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { CounselorAppointmentsController } from './counselor-appointments.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BriefsModule } from '../briefs/briefs.module';

@Module({
  imports: [PrismaModule, BriefsModule],
  controllers: [AppointmentsController, CounselorAppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
