import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(level?: string) {
    if (!level || level === 'all') {
      return this.prisma.resource.findMany({
        orderBy: [{ type: 'asc' }, { createdAt: 'desc' }],
      });
    }

    return this.prisma.resource.findMany({
      where: {
        OR: [
          { level: 'all' },
          { level: level.toLowerCase() },
        ],
      },
      orderBy: [{ type: 'asc' }, { createdAt: 'desc' }],
    });
  }
}
