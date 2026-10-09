import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('counselor/appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.COUNSELOR)
export class CounselorAppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  async findCounselorAppointments(@CurrentUser('userId') counselorId: string) {
    return this.appointmentsService.findCounselorAppointments(counselorId);
  }

  @Patch(':id')
  async updateStatus(
    @CurrentUser('userId') counselorId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentsService.updateStatusByCounselor(counselorId, id, dto.status);
  }
}
