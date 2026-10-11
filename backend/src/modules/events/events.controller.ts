import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { EventsService } from './events.service';

export class RegisterTeamDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  teamName: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  members?: string[];
}

@ApiTags('Campus Events & Clubs')
@ApiBearerAuth()
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
  async register(@Param('id') id: string, @Body() body: RegisterTeamDto) {
    return this.eventsService.registerTeam(id, body);
  }
}
