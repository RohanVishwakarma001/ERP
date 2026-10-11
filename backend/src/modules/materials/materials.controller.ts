import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MaterialsService } from './materials.service';

@ApiTags('Study Materials & Lecture Notes')
@ApiBearerAuth()
@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get()
  @ApiQuery({ name: 'subjectCode', required: false })
  @ApiOperation({ summary: 'Uploaded course materials, optionally for one subject' })
  findAll(@Query('subjectCode') subjectCode?: string) {
    return this.materialsService.findAll(subjectCode);
  }
}
