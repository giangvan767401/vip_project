import { Module, forwardRef } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CounselorModule } from '../counselor/counselor.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => CounselorModule),
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService],
  exports: [ConversationsService],
})
export class ConversationsModule {}
