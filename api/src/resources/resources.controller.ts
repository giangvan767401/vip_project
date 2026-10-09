import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('resources')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  async findAll(@Query('level') level?: string) {
    return this.resourcesService.findAll(level);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.resourcesService.findOne(id);
  }

  @Post()
  @Roles(Role.COUNSELOR)
  async create(
    @CurrentUser('userId') counselorId: string,
    @Body() dto: CreateResourceDto,
  ) {
    return this.resourcesService.create(counselorId, dto);
  }

  @Patch(':id')
  @Roles(Role.COUNSELOR)
  async update(
    @CurrentUser('userId') counselorId: string,
    @Param('id') id: string,
    @Body() dto: UpdateResourceDto,
  ) {
    return this.resourcesService.update(counselorId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.COUNSELOR)
  async remove(
    @CurrentUser('userId') counselorId: string,
    @Param('id') id: string,
  ) {
    return this.resourcesService.remove(counselorId, id);
  }
}
