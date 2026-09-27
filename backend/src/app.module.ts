import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { FacultyModule } from './faculty/faculty.module';
import { DepartmentsModule } from './departments/departments.module';
import { TimetableModule } from './timetable/timetable.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ExaminationsModule } from './examinations/examinations.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { MaterialsModule } from './materials/materials.module';
import { FeesModule } from './fees/fees.module';
import { NoticesModule } from './notices/notices.module';
import { NotificationsModule } from './notifications/notifications.module';
import { LeaveModule } from './leave/leave.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { DocumentsModule } from './documents/documents.module';
import { LibraryModule } from './library/library.module';
import { PlacementModule } from './placement/placement.module';
import { HostelModule } from './hostel/hostel.module';
import { TransportModule } from './transport/transport.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AiModule } from './ai/ai.module';
import { AuditModule } from './audit/audit.module';
import { HealthModule } from './health/health.module';
import { EventsModule } from './events/events.module';
import { FeedbackModule } from './feedback/feedback.module';
import { WebSocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    PrismaModule,
    WebSocketModule,
    AuthModule,
    StudentsModule,
    FacultyModule,
    DepartmentsModule,
    TimetableModule,
    AttendanceModule,
    ExaminationsModule,
    AssignmentsModule,
    MaterialsModule,
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
    HealthModule,
    EventsModule,
    FeedbackModule,
  ],
})
export class AppModule {}
