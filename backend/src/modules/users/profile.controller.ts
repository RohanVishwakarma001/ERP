import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators';
import { ChangePasswordDto } from '../auth/dto/auth.dto';
import { ProfileService } from './profile.service';

/** Every signed-in user, any role: their own details. */
@ApiTags('My Profile')
@ApiBearerAuth()
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'My complete profile: account, academic / employment details, hostel, transport, fee summary' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.profileService.getProfile(userId);
  }

  @Post('password')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiOperation({ summary: 'Change my password (signs out my other sessions)' })
  changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    return this.profileService.changePassword(userId, dto.oldPassword, dto.newPassword);
  }
}
