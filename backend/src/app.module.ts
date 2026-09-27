import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import * as Joi from 'joi';
import { PrismaModule } from './prisma/prisma.module';
import { EmailModule } from './common/email/email.module';
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
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
        PORT: Joi.number().default(8000),
        DATABASE_URL: Joi.string().uri().required(),
        DIRECT_URL: Joi.string().uri().optional(),
        JWT_ACCESS_SECRET: Joi.string().min(32).required(),
        JWT_REFRESH_SECRET: Joi.string().min(32).required(),
        JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
        JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),
        WEB_URL: Joi.string().uri().required(),
        MOBILE_APP_SCHEME: Joi.string().optional(),
        CORS_ORIGINS: Joi.string().allow('').optional(),
        ENABLE_SWAGGER: Joi.string().valid('true', 'false').optional(),
      }).unknown(true),
      validationOptions: {
        abortEarly: false,
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
    EmailModule,
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
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
