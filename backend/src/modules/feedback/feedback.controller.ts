import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { FeedbackService } from './feedback.service';

export class SubmitFeedbackDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  category: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @MaxLength(2000)
  comments: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}

@ApiTags('Campus & Course Feedback (IQAC)')
@ApiBearerAuth()
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @ApiOperation({ summary: 'Submit course or campus infrastructure feedback' })
  async submit(@Body() body: SubmitFeedbackDto) {
    return this.feedbackService.submitFeedback(body);
  }
}
