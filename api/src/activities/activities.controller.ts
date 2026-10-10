import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, JwtPayloadUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('activities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  /**
   * 1. GET /activities/today
   * Lấy danh sách 3–5 việc nhỏ hôm nay theo mức cảm xúc
   */
  @Get('today')
  @Roles(Role.USER)
  async getTodayActivities(@CurrentUser() user: JwtPayloadUser) {
    return this.activitiesService.getTodayActivities(user.userId);
  }

  /**
   * 2. GET /activities/streak
   * Lấy chuỗi ngày hoàn thành liên tiếp và lịch sử 30 ngày
   */
  @Get('streak')
  @Roles(Role.USER)
  async getStreak(@CurrentUser() user: JwtPayloadUser) {
    return this.activitiesService.getStreak(user.userId);
  }

  /**
   * 3. POST /activities/:id/complete
   * Đánh dấu hoàn thành hoạt động
   */
  @Post(':id/complete')
  @Roles(Role.USER)
  async completeActivity(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.activitiesService.completeActivity(id, user.userId);
  }

  /**
   * 4. DELETE /activities/:id/complete
   * Bỏ tick hoàn thành
   */
  @Delete(':id/complete')
  @Roles(Role.USER)
  async uncompleteActivity(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.activitiesService.uncompleteActivity(id, user.userId);
  }

  /**
   * 5. POST /activities/:id/swap
   * Đổi sang hoạt động khác (tối đa 2 lần/ngày)
   */
  @Post(':id/swap')
  @Roles(Role.USER)
  async swapActivity(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.activitiesService.swapActivity(id, user.userId);
  }
}
