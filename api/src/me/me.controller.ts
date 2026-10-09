import { Body, Controller, Delete, Get, UseGuards } from '@nestjs/common';
import { MeService } from './me.service';
import { DeleteMyDataDto } from './dto/delete-my-data.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('me')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get('export')
  @Roles(Role.USER)
  async exportData(@CurrentUser('userId') userId: string) {
    return this.meService.exportData(userId);
  }

  @Delete('data')
  @Roles(Role.USER)
  async deleteData(
    @CurrentUser('userId') userId: string,
    @Body() dto: DeleteMyDataDto,
  ) {
    return this.meService.deleteData(userId, dto.password);
  }
}
