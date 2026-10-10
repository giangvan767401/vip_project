import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { BriefsService } from './briefs.service';
import { CreateBriefPreviewDto } from './dto/create-brief-preview.dto';
import { CreateBriefDto } from './dto/create-brief.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import type { Response } from 'express';

@Controller('briefs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BriefsController {
  constructor(private readonly briefsService: BriefsService) {}

  // 15.1: Dựng bản nháp bằng quy tắc/thống kê
  @Post('preview')
  @Roles(Role.USER)
  async preview(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateBriefPreviewDto,
  ) {
    return this.briefsService.preview(userId, dto);
  }

  // 15.2: Gắn tóm tắt vào lịch hẹn của chính mình
  @Post()
  @Roles(Role.USER)
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateBriefDto,
  ) {
    return this.briefsService.create(userId, dto);
  }

  // 15.2: Sinh viên thu hồi tóm tắt ngay lập tức
  @Delete(':id')
  @Roles(Role.USER)
  async revoke(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.briefsService.revoke(userId, id);
  }

  // 15.3: Xuất PDF cho chính user
  @Get(':id/pdf')
  @Roles(Role.USER)
  async exportPdf(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    return this.briefsService.generatePdf(userId, id, res);
  }
}
