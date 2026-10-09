import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ConsentsService } from './consents.service';
import { CreateConsentDto } from './dto/create-consent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('consents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsentsController {
  constructor(private readonly consentsService: ConsentsService) {}

  @Get('me')
  @Roles(Role.USER)
  async getMyConsents(@CurrentUser('userId') userId: string) {
    return this.consentsService.getMyConsents(userId);
  }

  @Post()
  @Roles(Role.USER)
  async createConsent(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateConsentDto,
  ) {
    return this.consentsService.createOrUpdateConsent(userId, dto.counselorId);
  }

  @Delete(':id')
  @Roles(Role.USER)
  async revokeConsent(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.consentsService.revokeConsent(userId, id);
  }
}
