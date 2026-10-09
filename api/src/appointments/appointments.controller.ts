import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(Role.USER)
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(userId, dto);
  }

  @Get('me')
  @Roles(Role.USER)
  async findMyStudentAppointments(@CurrentUser('userId') userId: string) {
    return this.appointmentsService.findMyStudentAppointments(userId);
  }

  @Patch(':id/cancel')
  @Roles(Role.USER)
  async cancelByStudent(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.appointmentsService.cancelByStudent(userId, id);
  }
}
