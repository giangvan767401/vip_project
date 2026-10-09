import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
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

      if (payload.role !== Role.COUNSELOR) {
        client.disconnect(true);
        return;
      }

      client.data.user = payload;
      // Join room theo ID của counselor
      client.join(`counselor_${payload.userId}`);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect() {
    // Clean up if needed
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
