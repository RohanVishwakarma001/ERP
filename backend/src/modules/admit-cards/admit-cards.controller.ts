import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { CurrentStudentId, CurrentUser, Public, Roles } from '../../common/decorators';
import { RoleGroups } from '../../common/constants/role-groups';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { AdmitCardsService } from './admit-cards.service';
import { ApproveAdmitCardsDto, ListAdmitCardsQueryDto, RevokeAdmitCardDto } from './dto/admit-cards.dto';

const pdfFile = ({ pdf, fileName }: { pdf: Buffer; fileName: string }) =>
  new StreamableFile(pdf, { type: 'application/pdf', disposition: `attachment; filename="${fileName}"`, length: pdf.length });

@ApiTags('Admit Cards')
@ApiBearerAuth()
@Controller('admit-cards')
export class AdmitCardsController {
  constructor(private readonly admitCards: AdmitCardsService) {}

  @Get()
  @Roles(...RoleGroups.ADMINS)
  @ApiOperation({ summary: 'Admin: candidates for an exam with fee status, debarment and admit card state' })
  listForExam(@Query() query: ListAdmitCardsQueryDto) {
    return this.admitCards.listForExam(query.examId);
  }

  @Post('approve')
  @Roles(...RoleGroups.ADMINS)
  @ApiOperation({ summary: 'Admin: approve admit cards; students with dues or debarment are skipped unless overridden with a reason' })
  approve(@Body() dto: ApproveAdmitCardsDto, @CurrentUser() actor: AuthUser) {
    return this.admitCards.approve(dto, actor);
  }

  @Post(':id/revoke')
  @Roles(...RoleGroups.ADMINS)
  @ApiOperation({ summary: 'Admin: revoke an approved admit card' })
  revoke(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RevokeAdmitCardDto, @CurrentUser() actor: AuthUser) {
    return this.admitCards.revoke(id, dto, actor);
  }

  @Get('me')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Student: my exams, papers and admit card status' })
  listMine(@CurrentStudentId() studentId: string) {
    return this.admitCards.listMine(studentId);
  }

  @Get(':id/pdf')
  @Roles(UserRole.STUDENT, ...RoleGroups.ADMINS)
  @ApiProduces('application/pdf')
  @ApiOperation({ summary: 'Download an approved admit card (students: own card only)' })
  async pdf(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return pdfFile(await this.admitCards.renderPdf(id, user));
  }

  @Post(':id/download-link')
  @Roles(UserRole.STUDENT, ...RoleGroups.ADMINS)
  @ApiOperation({ summary: 'A 5-minute link that downloads the PDF without a bearer token (mobile app browser)' })
  downloadLink(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.admitCards.createDownloadLink(id, user);
  }

  @Public()
  @Get('download')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @ApiProduces('application/pdf')
  // Token in the query string, not the path: request logs record paths only.
  @ApiOperation({ summary: 'Download via a signed short-lived link' })
  async downloadWithToken(@Query('token') token: string) {
    return pdfFile(await this.admitCards.renderPdfFromToken(token));
  }
}
