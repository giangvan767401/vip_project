import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CounselorGateway } from '../counselor/counselor.gateway';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesQueryDto } from './dto/messages-query.dto';
import { ConversationStatus, Role } from '@prisma/client';

@Injectable()
export class ConversationsService {
  // In-memory rate limit store: userId -> mảng các timestamp gửi tin (ms)
  private readonly rateLimits = new Map<string, number[]>();

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => CounselorGateway))
    private readonly counselorGateway: CounselorGateway,
  ) {}

  // 1. Tạo yêu cầu kết nối trò chuyện (User -> Counselor)
  async createConversation(userId: string, role: string, dto: CreateConversationDto) {
    if (role !== Role.USER) {
      throw new ForbiddenException('Chỉ sinh viên mới có thể gửi yêu cầu nhắn tin với tư vấn viên');
    }

    const counselor = await this.prisma.user.findUnique({
      where: { id: dto.counselorId },
    });

    if (!counselor || counselor.role !== Role.COUNSELOR) {
      throw new BadRequestException('Tư vấn viên không tồn tại hoặc không hợp lệ');
    }

    // Kiểm tra nếu đã có cuộc trò chuyện PENDING hoặc ACTIVE giữa 2 bên
    const existing = await this.prisma.conversation.findFirst({
      where: {
        userId,
        counselorId: dto.counselorId,
        status: { in: [ConversationStatus.PENDING, ConversationStatus.ACTIVE] },
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true } },
        counselor: { select: { id: true, fullName: true, email: true, role: true } },
      },
    });

    if (existing) {
      return existing;
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        userId,
        counselorId: dto.counselorId,
        status: ConversationStatus.PENDING,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true } },
        counselor: { select: { id: true, fullName: true, email: true, role: true } },
      },
    });

    // Báo realtime tới counselor
    this.counselorGateway.notifyConversationStatus(
      conversation.id,
      conversation.status,
      conversation.userId,
      conversation.counselorId,
    );

    return conversation;
  }

  // 2. Lấy danh sách cuộc trò chuyện của mình
  async getMyConversations(callerId: string, role: string) {
    if (role === Role.ADMIN) {
      throw new ForbiddenException('Quản trị viên không có quyền truy cập tin nhắn cá nhân');
    }

    const whereCondition =
      role === Role.COUNSELOR
        ? { counselorId: callerId }
        : { userId: callerId };

    const conversations = await this.prisma.conversation.findMany({
      where: whereCondition,
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true } },
        counselor: { select: { id: true, fullName: true, email: true, role: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            senderId: true,
            content: true,
            createdAt: true,
            readAt: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Bổ sung số tin nhắn chưa đọc
    const results = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: callerId },
            readAt: null,
          },
        });

        const lastMessage = conv.messages[0] || null;

        return {
          id: conv.id,
          userId: conv.userId,
          counselorId: conv.counselorId,
          status: conv.status,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          user: conv.user,
          counselor: conv.counselor,
          lastMessage,
          unreadCount,
        };
      }),
    );

    return results;
  }

  // 3. Cập nhật trạng thái cuộc trò chuyện (chấp nhận hoặc đóng)
  async updateConversationStatus(
    id: string,
    callerId: string,
    callerRole: string,
    dto: UpdateConversationDto,
  ) {
    if (callerRole === Role.ADMIN) {
      throw new ForbiddenException('Quản trị viên không có quyền thay đổi trạng thái cuộc trò chuyện');
    }

    const conv = await this.prisma.conversation.findUnique({
      where: { id },
    });

    if (!conv) {
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    }

    // Kiểm tra quyền thành viên: người ngoài không được thao tác
    if (conv.userId !== callerId && conv.counselorId !== callerId) {
      throw new ForbiddenException('Bạn không có quyền thay đổi cuộc trò chuyện này');
    }

    if (dto.status === ConversationStatus.ACTIVE) {
      // Chỉ counselor trong cuộc trò chuyện mới được duyệt từ PENDING sang ACTIVE
      if (conv.counselorId !== callerId) {
        throw new ForbiddenException('Chỉ tư vấn viên mới có quyền chấp nhận yêu cầu trò chuyện');
      }
      if (conv.status !== ConversationStatus.PENDING) {
        throw new BadRequestException('Chỉ có thể chấp nhận cuộc trò chuyện đang ở trạng thái chờ');
      }
    } else if (dto.status === ConversationStatus.CLOSED) {
      if (conv.status === ConversationStatus.CLOSED) {
        throw new BadRequestException('Cuộc trò chuyện này đã được đóng trước đó');
      }
      // Cả 2 bên đều có thể đóng cuộc trò chuyện
    } else if (dto.status === ConversationStatus.PENDING) {
      throw new BadRequestException('Không thể chuyển trạng thái về chờ duyệt');
    }

    const updated = await this.prisma.conversation.update({
      where: { id },
      data: { status: dto.status },
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true } },
        counselor: { select: { id: true, fullName: true, email: true, role: true } },
      },
    });

    // Báo realtime trạng thái mới
    this.counselorGateway.notifyConversationStatus(
      updated.id,
      updated.status,
      updated.userId,
      updated.counselorId,
    );

    return updated;
  }

  // 4. Lấy danh sách tin nhắn trong cuộc trò chuyện (phân trang)
  async getMessages(
    conversationId: string,
    callerId: string,
    callerRole: string,
    query: MessagesQueryDto,
  ) {
    if (callerRole === Role.ADMIN) {
      throw new ForbiddenException('Quản trị viên không có quyền truy cập tin nhắn cá nhân');
    }

    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conv) {
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    }

    // Bảo mật: Người ngoài bị 403 Forbidden
    if (conv.userId !== callerId && conv.counselorId !== callerId) {
      throw new ForbiddenException('Bạn không có quyền truy cập tin nhắn của cuộc trò chuyện này');
    }

    // Tự động đánh dấu đã đọc các tin nhắn do đối phương gửi
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: callerId },
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    const page = query.page || 1;
    const limit = query.limit || 30;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
        include: {
          sender: {
            select: { id: true, fullName: true, role: true },
          },
        },
      }),
      this.prisma.message.count({
        where: { conversationId },
      }),
    ]);

    return {
      messages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // 5. Gửi tin nhắn mới (chỉ khi ACTIVE, có rate limit và giới hạn độ dài)
  async sendMessage(
    conversationId: string,
    callerId: string,
    callerRole: string,
    dto: CreateMessageDto,
  ) {
    if (callerRole === Role.ADMIN) {
      throw new ForbiddenException('Quản trị viên không thể gửi tin nhắn trong cuộc trò chuyện');
    }

    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conv) {
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    }

    // Người ngoài cuộc trò chuyện -> 403 Forbidden
    if (conv.userId !== callerId && conv.counselorId !== callerId) {
      throw new ForbiddenException('Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này');
    }

    // Chỉ gửi được khi cuộc trò chuyện ở trạng thái ACTIVE
    if (conv.status === ConversationStatus.PENDING) {
      throw new BadRequestException('Cuộc trò chuyện đang chờ tư vấn viên chấp nhận, chưa thể gửi tin');
    }
    if (conv.status === ConversationStatus.CLOSED) {
      throw new BadRequestException('Cuộc trò chuyện đã kết thúc, không thể gửi thêm tin nhắn');
    }

    const content = dto.content ? dto.content.trim() : '';
    if (!content) {
      throw new BadRequestException('Nội dung tin nhắn không được rỗng');
    }

    // Rate limiting: Tối đa 5 tin nhắn trong 3 giây
    this.checkRateLimit(callerId);

    // Lưu tin nhắn (TUYỆT ĐỐI KHÔNG LOG NỘI DUNG TIN NHẮN THEO QUY ĐỊNH BẢO MẬT)
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: callerId,
        content,
      },
      include: {
        sender: {
          select: { id: true, fullName: true, role: true },
        },
      },
    });

    // Cập nhật updatedAt của conversation
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Realtime notification
    const recipientId = conv.userId === callerId ? conv.counselorId : conv.userId;
    this.counselorGateway.notifyNewMessage(conversationId, message, recipientId);

    return message;
  }

  // 6. Đánh dấu tất cả tin nhắn trong conversation đã đọc
  async markAsRead(conversationId: string, callerId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conv) {
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    }

    if (conv.userId !== callerId && conv.counselorId !== callerId) {
      throw new ForbiddenException('Bạn không có quyền truy cập');
    }

    const now = new Date();
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: callerId },
        readAt: null,
      },
      data: {
        readAt: now,
      },
    });

    return { success: true, readAt: now.toISOString() };
  }

  // Rate limit helper: tối đa 5 tin nhắn / 3 giây
  private checkRateLimit(userId: string) {
    const now = Date.now();
    const windowMs = 3000;
    const maxRequests = 5;

    const timestamps = this.rateLimits.get(userId) || [];
    const validTimestamps = timestamps.filter((time) => now - time < windowMs);

    if (validTimestamps.length >= maxRequests) {
      throw new HttpException(
        'Bạn đang gửi tin nhắn quá nhanh. Vui lòng đợi trong giây lát.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    validTimestamps.push(now);
    this.rateLimits.set(userId, validTimestamps);
  }
}
