import { IsEnum, IsNotEmpty } from 'class-validator';
import { ConversationStatus } from '@prisma/client';

export class UpdateConversationDto {
  @IsNotEmpty({ message: 'status không được để trống' })
  @IsEnum(ConversationStatus, { message: 'status phải là PENDING, ACTIVE hoặc CLOSED' })
  status!: ConversationStatus;
}
