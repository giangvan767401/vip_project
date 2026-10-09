import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { CreateCounselorDto } from './dto/create-counselor.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { CreateAlertRuleDto } from './dto/create-alert-rule.dto';
import { UpdateAlertRuleDto } from './dto/update-alert-rule.dto';
import { UpdateResourceVisibilityDto } from './dto/update-resource-visibility.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==========================================
  // 11.1 QUẢN LÝ TÀI KHOẢN (NGHIÊM NGẶT BẢO MẬT)
  // KHÔNG TRẢ DỮ LIỆU CẢM XÚC HOẶC NHẬT KÝ CÁ NHÂN
  // ==========================================
  @Get('users')
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Post('counselors')
  async createCounselor(@Body() dto: CreateCounselorDto) {
    return this.adminService.createCounselor(dto);
  }

  @Patch('users/:id/role')
  async updateUserRole(
    @Param('id') targetUserId: string,
    @CurrentUser('userId') currentAdminId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(targetUserId, currentAdminId, dto.role);
  }

  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id') targetUserId: string,
    @CurrentUser('userId') currentAdminId: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(targetUserId, currentAdminId, dto.isActive);
  }

  // ==========================================
  // 11.2 QUẢN LÝ NGƯỠNG CẢNH BÁO
  // ==========================================
  @Get('alert-rules')
  async getAlertRules() {
    return this.adminService.getAlertRules();
  }

  @Post('alert-rules')
  async createAlertRule(@Body() dto: CreateAlertRuleDto) {
    return this.adminService.createAlertRule(dto);
  }

  @Patch('alert-rules/:id')
  async updateAlertRule(
    @Param('id') id: string,
    @Body() dto: UpdateAlertRuleDto,
  ) {
    return this.adminService.updateAlertRule(id, dto);
  }

  @Delete('alert-rules/:id')
  async deleteAlertRule(@Param('id') id: string) {
    return this.adminService.deleteAlertRule(id);
  }

  // ==========================================
  // 11.3 THỐNG KÊ HỆ THỐNG & KIỂM DUYỆT TÀI LIỆU
  // ==========================================
  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('resources')
  async getAllResources() {
    return this.adminService.getAllResources();
  }

  @Patch('resources/:id/visibility')
  async updateResourceVisibility(
    @Param('id') id: string,
    @Body() dto: UpdateResourceVisibilityDto,
  ) {
    return this.adminService.updateResourceVisibility(id, dto.isPublished);
  }

  @Delete('resources/:id')
  async deleteResource(@Param('id') id: string) {
    return this.adminService.deleteResource(id);
  }
}
