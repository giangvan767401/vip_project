import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JournalEntriesService } from './journal-entries.service';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { UpdateJournalEntryDto } from './dto/update-journal-entry.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('journal-entries')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JournalEntriesController {
  constructor(private readonly journalEntriesService: JournalEntriesService) {}

  @Post()
  @Roles(Role.USER)
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateJournalEntryDto,
  ) {
    return this.journalEntriesService.create(userId, dto);
  }

  @Get()
  @Roles(Role.USER)
  async findAll(@CurrentUser('userId') userId: string) {
    return this.journalEntriesService.findAll(userId);
  }

  @Get(':id')
  @Roles(Role.USER)
  async findOne(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.journalEntriesService.findOne(userId, id);
  }

  @Patch(':id')
  @Roles(Role.USER)
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateJournalEntryDto,
  ) {
    return this.journalEntriesService.update(userId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.USER)
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.journalEntriesService.remove(userId, id);
  }
}
