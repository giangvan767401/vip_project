import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { UpdateJournalEntryDto } from './dto/update-journal-entry.dto';

@Injectable()
export class JournalEntriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateJournalEntryDto) {
    return this.prisma.journalEntry.create({
      data: {
        userId,
        mood: dto.mood,
        note: dto.note,
        date: dto.date ? new Date(dto.date) : new Date(),
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.journalEntry.findMany({
      where: { userId },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(userId: string, id: string) {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id, userId },
    });
    if (!entry) {
      throw new NotFoundException('Không tìm thấy bản ghi nhật ký');
    }
    return entry;
  }

  async update(userId: string, id: string, dto: UpdateJournalEntryDto) {
    // Verify ownership
    await this.findOne(userId, id);

    return this.prisma.journalEntry.update({
      where: { id },
      data: {
        ...(dto.mood !== undefined ? { mood: dto.mood } : {}),
        ...(dto.note !== undefined ? { note: dto.note } : {}),
        ...(dto.date !== undefined ? { date: new Date(dto.date) } : {}),
      },
    });
  }

  async remove(userId: string, id: string) {
    // Verify ownership
    await this.findOne(userId, id);

    await this.prisma.journalEntry.delete({
      where: { id },
    });
    return { message: 'Đã xóa bản ghi nhật ký thành công' };
  }
}
