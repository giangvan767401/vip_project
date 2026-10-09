import { Controller, Get, UseGuards } from '@nestjs/common';
import { ConsentsService } from './consents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('counselors')
@UseGuards(JwtAuthGuard)
export class CounselorsController {
  constructor(private readonly consentsService: ConsentsService) {}

  @Get()
  async findAllCounselors() {
    return this.consentsService.findAllCounselors();
  }
}
