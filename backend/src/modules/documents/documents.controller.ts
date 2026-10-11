import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { CertificateType, UserRole } from '@prisma/client';
import { DocumentsService } from './documents.service';
import { CurrentStudentId, CurrentUser, Public, Roles } from '../../common/decorators';
import { RoleGroups } from '../../common/constants/role-groups';

class RequestCertificateDto {
  @IsEnum(CertificateType)
  type: CertificateType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  purpose: string;
}

@ApiTags('Documents & Certificates')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @ApiBearerAuth()
  @Get('my')
  @ApiOperation({ summary: 'Own KYC and academic documents' })
  getMyDocuments(@CurrentUser('id') userId: string) {
    return this.documentsService.getMyDocuments(userId);
  }

  @ApiBearerAuth()
  @Get('certificates/my')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Student: own certificate requests and issued certificates' })
  getMyCertificates(@CurrentStudentId() studentId: string) {
    return this.documentsService.getMyCertificates(studentId);
  }

  @ApiBearerAuth()
  @Post('certificates/request')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Student: request a Bonafide / Character / NOC / Migration certificate' })
  requestCertificate(@CurrentStudentId() studentId: string, @Body() dto: RequestCertificateDto) {
    return this.documentsService.requestCertificate(studentId, dto.type, dto.purpose);
  }

  @ApiBearerAuth()
  @Get('certificates/pending')
  @Roles(...RoleGroups.ADMINS)
  @ApiOperation({ summary: 'Registrar: certificate requests awaiting issue' })
  getPending() {
    return this.documentsService.getPendingCertificateRequests();
  }

  @ApiBearerAuth()
  @Post('certificates/:id/issue')
  @Roles(...RoleGroups.ADMINS)
  @ApiOperation({ summary: 'Registrar: issue a pending certificate and generate its verification code' })
  issue(@Param('id') id: string) {
    return this.documentsService.issueCertificate(id);
  }

  @Public()
  @Get('certificates/verify/:code')
  @ApiOperation({ summary: 'Public: verify a certificate by its QR verification code' })
  verifyCertificate(@Param('code') code: string) {
    return this.documentsService.verifyCertificate(code);
  }
}
