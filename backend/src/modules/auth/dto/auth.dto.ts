import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { STRONG_PASSWORD, STRONG_PASSWORD_MESSAGE } from '../../../common/validators/password';

const OTP_PATTERN = /^\d{6}$/;

export class LoginDto {
  @ApiProperty({ example: 'name@jbitdoon.edu.in', description: 'Institutional email or roll/faculty ID' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(254)
  identifier: string;

  @ApiProperty({ description: 'User password' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(128)
  password: string;

  @ApiPropertyOptional({ example: 'STUDENT', description: 'Optional role hint for multi-role accounts' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  role?: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Valid refresh token string' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(2048)
  refreshToken: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'name@jbitdoon.edu.in' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(254)
  identifier: string;

  @ApiProperty({ example: '482910', description: '6-digit OTP code' })
  @IsString()
  @Matches(OTP_PATTERN, { message: 'Verification code must be 6 digits.' })
  otp: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'name@jbitdoon.edu.in' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(254)
  identifier: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'name@jbitdoon.edu.in' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(254)
  identifier: string;

  @ApiProperty({ example: '482910' })
  @IsString()
  @Matches(OTP_PATTERN, { message: 'Verification code must be 6 digits.' })
  otp: string;

  @ApiProperty({ example: 'NewSecret@2026' })
  @IsString()
  @Matches(STRONG_PASSWORD, { message: STRONG_PASSWORD_MESSAGE })
  newPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'CurrentSecret@2026' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(128)
  oldPassword: string;

  @ApiProperty({ example: 'NewSecret@2026' })
  @IsString()
  @Matches(STRONG_PASSWORD, { message: STRONG_PASSWORD_MESSAGE })
  newPassword: string;
}
