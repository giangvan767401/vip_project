import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ConsentStatus, Role } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class CounselorGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const authHeader = client.handshake.headers.authorization;
      const authToken = client.handshake.auth?.token;
      const rawToken = authToken || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader);

      if (!rawToken) {
        client.disconnect(true);
        return;
      }

      const secret = this.configService.get<string>('JWT_SECRET', 'mindlog_jwt_secret_key');
      const payload = await this.jwtService.verifyAsync(rawToken, { secret });

      if (!payload || !payload.userId) {
        client.disconnect(true);
        return;
      }

      client.data.user = payload;

      // Join room cá nhân để nhận thông báo trực tiếp
      client.join(`user_${payload.userId}`);

      // Nếu là counselor, join room counselor để nhận cảnh báo kéo dài (tương thích module cũ)
      if (payload.role === Role.COUNSELOR) {
        client.join(`counselor_${payload.userId}`);
      }
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect() {
    // Clean up if needed
  }

  @SubscribeMessage('conversation:join')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const user = client.data?.user;
    if (!user || !data?.conversationId) {
      client.emit('error', { message: 'Không hợp lệ', code: 400 });
      return;
    }

    const conv = await this.prisma.conversation.findUnique({
      where: { id: data.conversationId },
    });

    if (!conv) {
      client.emit('error', { message: 'Cuộc trò chuyện không tồn tại', code: 404 });
      return;
    }

    // Bảo mật: Người ngoài conversation (kể cả ADMIN hay role khác) đều bị chặn 403
    if (conv.userId !== user.userId && conv.counselorId !== user.userId) {
      client.emit('error', {
        message: 'Bạn không có quyền tham gia cuộc trò chuyện này',
        code: 403,
      });
      return;
    }

    client.join(`conversation_${conv.id}`);
    client.emit('conversation:joined', { conversationId: conv.id });
  }

  @SubscribeMessage('conversation:leave')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (data?.conversationId) {
      client.leave(`conversation_${data.conversationId}`);
      client.emit('conversation:left', { conversationId: data.conversationId });
    }
  }

  @SubscribeMessage('message:read')
  async handleMarkMessagesAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const user = client.data?.user;
    if (!user || !data?.conversationId) return;

    const conv = await this.prisma.conversation.findUnique({
      where: { id: data.conversationId },
    });

    if (!conv || (conv.userId !== user.userId && conv.counselorId !== user.userId)) {
      client.emit('error', { message: 'Không có quyền', code: 403 });
      return;
    }

    // Cập nhật readAt cho các tin nhắn do đối phương gửi
    const now = new Date();
    await this.prisma.message.updateMany({
      where: {
        conversationId: data.conversationId,
        senderId: { not: user.userId },
        readAt: null,
      },
      data: {
        readAt: now,
      },
    });

    // Thông báo cho cả phòng chat rằng tin nhắn đã đọc
    this.server.to(`conversation_${data.conversationId}`).emit('message:read', {
      conversationId: data.conversationId,
      readBy: user.userId,
      readAt: now.toISOString(),
    });
  }

  // Phương thức helper gửi realtime tin nhắn mới tới room và recipient
  notifyNewMessage(conversationId: string, message: unknown, recipientId: string) {
    if (!this.server) return;
    this.server.to(`conversation_${conversationId}`).emit('message:new', message);
    this.server.to(`user_${recipientId}`).emit('message:notify', message);
    this.server.to(`counselor_${recipientId}`).emit('message:notify', message);
  }

  // Phương thức helper gửi thông báo thay đổi trạng thái cuộc trò chuyện
  notifyConversationStatus(
    conversationId: string,
    status: string,
    userId: string,
    counselorId: string,
  ) {
    if (!this.server) return;
    const payload = { conversationId, status, timestamp: new Date().toISOString() };
    this.server.to(`conversation_${conversationId}`).emit('conversation:status_changed', payload);
    this.server.to(`user_${userId}`).emit('conversation:status_changed', payload);
    this.server.to(`user_${counselorId}`).emit('conversation:status_changed', payload);
    this.server.to(`counselor_${counselorId}`).emit('conversation:status_changed', payload);
  }


  // Đẩy cảnh báo realtime khi học sinh đạt mức nguy cơ kéo dài
  async notifyProlongedAlert(userId: string, alertData: unknown) {
    if (!this.server) return;

    // Chỉ tìm những counselor có ConsentShare ACTIVE với sinh viên này
    const activeConsents = await this.prisma.consentShare.findMany({
      where: {
        userId,
        status: ConsentStatus.ACTIVE,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (activeConsents.length === 0) {
      return;
    }

    const student = activeConsents[0].user;

    for (const consent of activeConsents) {
      this.server.to(`counselor_${consent.counselorId}`).emit('alert:prolonged', {
        studentId: student.id,
        studentName: student.fullName,
        studentEmail: student.email,
        level: 'keo_dai',
        alert: alertData,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
