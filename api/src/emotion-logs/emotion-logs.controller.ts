import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { EmotionLogsService } from './emotion-logs.service';
import { CreateEmotionLogDto } from './dto/create-emotion-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('emotion-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmotionLogsController {
  constructor(private readonly emotionLogsService: EmotionLogsService) {}

  @Post()
  @Roles(Role.USER)
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateEmotionLogDto,
  ) {
    return this.emotionLogsService.create(userId, dto);
  }

  @Get()
  @Roles(Role.USER)
  async findMine(@CurrentUser('userId') userId: string) {
    return this.emotionLogsService.findByUser(userId);
  }
}
