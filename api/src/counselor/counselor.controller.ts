import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CounselorService } from './counselor.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('counselor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.COUNSELOR)
export class CounselorController {
  constructor(private readonly counselorService: CounselorService) {}

  @Get('clients')
  async getClients(@CurrentUser('userId') counselorId: string) {
    return this.counselorService.getClients(counselorId);
  }

  @Get('clients/:id/summary')
  async getClientSummary(
    @CurrentUser('userId') counselorId: string,
    @Param('id') studentId: string,
    @Query('range') range?: 'day' | 'week',
  ) {
    return this.counselorService.getClientSummary(counselorId, studentId, range);
  }

  @Get('stats')
  async getSystemStats() {
    return this.counselorService.getSystemStats();
  }
}
