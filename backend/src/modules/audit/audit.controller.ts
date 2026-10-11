import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { Roles } from '../../common/decorators';
import { UserRole } from '@prisma/client';

@ApiTags('Institutional Audit Trail')
@ApiBearerAuth()
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @ApiOperation({ summary: 'Super Admin: View immutable institutional audit trail' })
  async findAll() {
    return this.auditService.findAll();
  }
}
