import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(level?: string) {
    const whereClause: Record<string, unknown> = {};
    if (level && level !== 'all') {
      whereClause.OR = [
        { level: 'all' },
        { level: level.toLowerCase() },
      ];
    }

    return this.prisma.resource.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: [{ type: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!resource) {
      throw new NotFoundException('Không tìm thấy tài liệu này');
    }

    return resource;
  }

  // 10.2: Chuyên viên tạo tài nguyên mới
  async create(creatorId: string, dto: CreateResourceDto) {
    return this.prisma.resource.create({
      data: {
        creatorId,
        title: dto.title,
        description: dto.description ?? null,
        type: dto.type,
        level: dto.level?.toLowerCase() || 'all',
        content: dto.content ?? null,
        url: dto.url ?? null,
        durationMinutes: dto.durationMinutes ?? null,
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  // 10.2: Chuyên viên sửa tài nguyên (chỉ sửa tài nguyên do chính mình tạo)
  async update(creatorId: string, id: string, dto: UpdateResourceDto) {
    const resource = await this.findOne(id);

    if (resource.creatorId !== creatorId) {
      throw new ForbiddenException(
        'Bạn chỉ có quyền chỉnh sửa tài liệu hoặc bài tập do chính mình tạo ra.',
      );
    }

    return this.prisma.resource.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        level: dto.level ? dto.level.toLowerCase() : undefined,
        content: dto.content,
        url: dto.url,
        durationMinutes: dto.durationMinutes,
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  // 10.2: Chuyên viên xóa tài nguyên (chỉ xóa tài nguyên do chính mình tạo)
  async remove(creatorId: string, id: string) {
    const resource = await this.findOne(id);

    if (resource.creatorId !== creatorId) {
      throw new ForbiddenException(
        'Bạn chỉ có quyền xóa tài liệu hoặc bài tập do chính mình tạo ra.',
      );
    }

    await this.prisma.resource.delete({
      where: { id },
    });

    return { message: 'Đã xóa tài liệu thành công' };
  }
}
