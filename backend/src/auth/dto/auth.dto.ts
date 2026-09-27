import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'aarav.sharma@jbitdoon.edu.in', description: 'Institutional email or roll/faculty ID' })
  @IsNotEmpty()
  @IsString()
  identifier: string;

  @ApiProperty({ example: 'Jbit@2026', description: 'User password' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiPropertyOptional({ example: 'STUDENT', description: 'Optional role hint for multi-role accounts' })
  @IsOptional()
  @IsString()
  role?: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Valid refresh token string' })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'aarav.sharma@jbitdoon.edu.in' })
  @IsNotEmpty()
  @IsString()
  identifier: string;

  @ApiProperty({ example: '482910', description: '6-digit OTP code' })
  @IsNotEmpty()
  @IsString()
  otp: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'aarav.sharma@jbitdoon.edu.in' })
  @IsNotEmpty()
  @IsString()
  identifier: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'aarav.sharma@jbitdoon.edu.in' })
  @IsNotEmpty()
  @IsString()
  identifier: string;

  @ApiProperty({ example: '482910' })
  @IsNotEmpty()
  @IsString()
  otp: string;

  @ApiProperty({ example: 'NewSecret@2026' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'CurrentSecret@2026' })
  @IsNotEmpty()
  @IsString()
  oldPassword: string;

  @ApiProperty({ example: 'NewSecret@2026' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  newPassword: string;
}
