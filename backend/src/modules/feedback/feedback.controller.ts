import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Campus & Course Feedback (IQAC)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @ApiOperation({ summary: 'Submit course or campus infrastructure feedback' })
  async submit(@Body() body: any) {
    return this.feedbackService.submitFeedback(body);
  }
}
