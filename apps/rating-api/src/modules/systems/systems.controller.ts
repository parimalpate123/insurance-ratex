import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query,
} from '@nestjs/common';
import { SystemsService } from './systems.service';
import { SystemEntity } from '../../entities/system.entity';

@Controller('api/v1/systems')
export class SystemsController {
  constructor(private readonly service: SystemsService) {}

  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.service.findAll(includeInactive === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: Partial<SystemEntity>) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<SystemEntity>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
