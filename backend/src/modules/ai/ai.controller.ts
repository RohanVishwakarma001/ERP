import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { AiService } from './ai.service';
import { CurrentUser } from '../../common/decorators';
import { AuthUser } from '../../common/interfaces/auth-user.interface';

class ChatQueryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  query: string;
}

@ApiTags('JBIT AI Campus Copilot')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Ask the campus copilot a question answered from the caller's own records" })
  chat(@CurrentUser() user: AuthUser, @Body() dto: ChatQueryDto) {
    return this.aiService.processCampusQuery(user, dto.query);
  }
}
