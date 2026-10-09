import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConsentStatus, Role } from '@prisma/client';

@Injectable()
export class ConsentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllCounselors() {
    return this.prisma.user.findMany({
      where: { role: Role.COUNSELOR },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async getMyConsents(userId: string) {
    return this.prisma.consentShare.findMany({
      where: { userId },
      include: {
        counselor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createOrUpdateConsent(userId: string, counselorId: string) {
    if (userId === counselorId) {
      throw new BadRequestException('Không thể chia sẻ dữ liệu cho chính mình');
    }

    const counselor = await this.prisma.user.findFirst({
      where: { id: counselorId, role: Role.COUNSELOR },
    });

    if (!counselor) {
      throw new NotFoundException('Không tìm thấy tư vấn viên chỉ định');
    }

    return this.prisma.consentShare.upsert({
      where: {
        userId_counselorId: {
          userId,
          counselorId,
        },
      },
      update: {
        status: ConsentStatus.ACTIVE,
        grantedAt: new Date(),
        revokedAt: null,
      },
      create: {
        userId,
        counselorId,
        status: ConsentStatus.ACTIVE,
        grantedAt: new Date(),
      },
      include: {
        counselor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async revokeConsent(userId: string, id: string) {
    const consent = await this.prisma.consentShare.findFirst({
      where: { id, userId },
    });

    if (!consent) {
      throw new NotFoundException('Không tìm thấy bản ghi chia sẻ');
    }

    return this.prisma.consentShare.update({
      where: { id },
      data: {
        status: ConsentStatus.REVOKED,
        revokedAt: new Date(),
      },
      include: {
        counselor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }
}
