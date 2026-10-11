import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Campus Events & Clubs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of upcoming technical, cultural, and sports events' })
  async findAll() {
    return this.eventsService.findAll();
  }

  @Post(':id/register')
  @ApiOperation({ summary: 'Register team for event' })
  async register(@Param('id') id: string, @Body() body: any) {
    return this.eventsService.registerTeam(id, body);
  }
}
