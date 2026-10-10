import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesQueryDto } from './dto/messages-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, JwtPayloadUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('conversations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  // 1. Sinh viên gửi yêu cầu nhắn tin tới tư vấn viên
  @Post()
  @Roles(Role.USER)
  async createConversation(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: CreateConversationDto,
  ) {
    return this.conversationsService.createConversation(user.userId, user.role, dto);
  }

  // 2. Lấy danh sách cuộc trò chuyện của mình (USER hoặc COUNSELOR)
  @Get()
  @Roles(Role.USER, Role.COUNSELOR)
  async getMyConversations(@CurrentUser() user: JwtPayloadUser) {
    return this.conversationsService.getMyConversations(user.userId, user.role);
  }

  // 3. Cập nhật trạng thái: counselor chấp nhận (ACTIVE); cả hai bên đóng (CLOSED)
  @Patch(':id')
  @Roles(Role.USER, Role.COUNSELOR)
  async updateConversationStatus(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: UpdateConversationDto,
  ) {
    return this.conversationsService.updateConversationStatus(id, user.userId, user.role, dto);
  }

  // 4. Lấy danh sách tin nhắn trong cuộc trò chuyện (phân trang)
  @Get(':id/messages')
  @Roles(Role.USER, Role.COUNSELOR)
  async getMessages(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayloadUser,
    @Query() query: MessagesQueryDto,
  ) {
    return this.conversationsService.getMessages(id, user.userId, user.role, query);
  }

  // 5. Gửi tin nhắn mới (chỉ khi ACTIVE, rate limit)
  @Post(':id/messages')
  @Roles(Role.USER, Role.COUNSELOR)
  async sendMessage(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: CreateMessageDto,
  ) {
    return this.conversationsService.sendMessage(id, user.userId, user.role, dto);
  }

  // 6. Đánh dấu tất cả tin nhắn đã đọc
  @Patch(':id/read')
  @Roles(Role.USER, Role.COUNSELOR)
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.conversationsService.markAsRead(id, user.userId);
  }
}
