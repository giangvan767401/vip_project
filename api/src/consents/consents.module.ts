import { Module } from '@nestjs/common';
import { ConsentsService } from './consents.service';
import { ConsentsController } from './consents.controller';
import { CounselorsController } from './counselors.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ConsentsController, CounselorsController],
  providers: [ConsentsService],
  exports: [ConsentsService],
})
export class ConsentsModule {}
