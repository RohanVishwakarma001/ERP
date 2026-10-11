import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppConfigModule } from './config';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

// Infrastructure — global, technology-specific adapters.
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { EmailModule } from './infrastructure/email/email.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { WebSocketModule } from './infrastructure/websocket/websocket.module';

// Feature modules — one per business domain.
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { StudentsModule } from './modules/students/students.module';
import { FacultyModule } from './modules/faculty/faculty.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { TimetableModule } from './modules/timetable/timetable.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { ExaminationsModule } from './modules/examinations/examinations.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { FeesModule } from './modules/fees/fees.module';
import { NoticesModule } from './modules/notices/notices.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { LeaveModule } from './modules/leave/leave.module';
import { ComplaintsModule } from './modules/complaints/complaints.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { LibraryModule } from './modules/library/library.module';
import { PlacementModule } from './modules/placement/placement.module';
import { HostelModule } from './modules/hostel/hostel.module';
import { TransportModule } from './modules/transport/transport.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AiModule } from './modules/ai/ai.module';
import { AuditModule } from './modules/audit/audit.module';
import { AdmitCardsModule } from './modules/admit-cards/admit-cards.module';

@Module({
  imports: [
    AppConfigModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

    PrismaModule,
    EmailModule,
    StorageModule,
    WebSocketModule,

    AuthModule,
    HealthModule,
    UsersModule,
    StudentsModule,
    FacultyModule,
    DepartmentsModule,
    TimetableModule,
    AttendanceModule,
    ExaminationsModule,
    AssignmentsModule,
    MaterialsModule,
    UploadsModule,
    FeesModule,
    NoticesModule,
    NotificationsModule,
    LeaveModule,
    ComplaintsModule,
    DocumentsModule,
    LibraryModule,
    PlacementModule,
    HostelModule,
    TransportModule,
    AnalyticsModule,
    AiModule,
    AuditModule,
    AdmitCardsModule,
  ],
  providers: [
    // Order matters: rate-limit first, then authenticate, then authorize.
    // Every route requires a valid JWT unless marked @Public(); @Roles() narrows further.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
