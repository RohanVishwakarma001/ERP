import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { CertificateType } from '@prisma/client';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, Public } from '../common/decorators';

class RequestCertificateDto {
  @IsEnum(CertificateType)
  type: CertificateType;

  @IsString()
  @IsNotEmpty()
  purpose: string;
}

@ApiTags('Documents & Certificates')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('my')
  @ApiOperation({ summary: 'Get list of personal KYC and academic documents' })
  async getMyDocuments(@CurrentUser('id') userId: string) {
    return this.documentsService.getMyDocuments(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('certificates/my')
  @ApiOperation({ summary: 'Get student certificates issued or pending' })
  async getMyCertificates(@CurrentUser('studentId') studentId: string) {
    return this.documentsService.getMyCertificates(studentId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('certificates/request')
  @ApiOperation({ summary: 'Student: Apply for Bonafide, Character, NOC, or Migration Certificate' })
  async requestCertificate(@CurrentUser('studentId') studentId: string, @Body() dto: RequestCertificateDto) {
    return this.documentsService.requestCertificate({
      studentId,
      type: dto.type,
      purpose: dto.purpose,
    });
  }

  @Public()
  @Get('certificates/verify/:code')
  @ApiOperation({ summary: 'Public QR Endpoint: Verify authenticity of institutional certificate' })
  async verifyCertificate(@Param('code') code: string) {
    return this.documentsService.verifyCertificate(code);
  }
}
