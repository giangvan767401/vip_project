import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmotionLogDto } from './dto/create-emotion-log.dto';

@Injectable()
export class EmotionLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateEmotionLogDto) {
    return this.prisma.emotionLog.create({
      data: {
        userId,
        emotion: dto.emotion,
        positiveScore: dto.positiveScore,
        negativeScore: dto.negativeScore,
        startedAt: new Date(dto.startedAt),
        endedAt: new Date(dto.endedAt),
        scores: dto.scores ?? {},
        note: dto.note,
      },
    });
  }

  async findByUser(userId: string, limit = 50) {
    return this.prisma.emotionLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
