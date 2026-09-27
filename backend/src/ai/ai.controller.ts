import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@ApiTags('JBIT AI Campus Copilot')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Send conversational query to JBIT Campus Copilot' })
  async chat(@CurrentUser() user: any, @Body('query') query: string) {
    return this.aiService.processCampusQuery(
      user.id,
      user.studentId || user.id || 'stu-01',
      query,
    );
  }
}
