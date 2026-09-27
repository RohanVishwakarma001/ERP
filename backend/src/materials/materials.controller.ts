import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MaterialsService } from './materials.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Study Materials & Lecture Notes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of uploaded academic course materials' })
  async findAll() {
    return this.materialsService.findAll();
  }
}
