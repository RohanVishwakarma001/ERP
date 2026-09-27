import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('JBIT-Bootstrap');
  // rawBody is required to verify Razorpay's webhook HMAC signature, which must be
  // computed over the exact unparsed request bytes.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(helmet());

  // Global API Prefix
  app.setGlobalPrefix('api/v1');

  // CORS Configuration — strict allowlist, no wildcard fallback.
  const allowedOrigins = new Set(
    [process.env.WEB_URL, ...(process.env.CORS_ORIGINS?.split(',') ?? [])]
      .map((o) => o?.trim())
      .filter((o): o is string => Boolean(o)),
  );

  if (!isProduction) {
    allowedOrigins.add('http://localhost:3000');
    allowedOrigins.add('http://127.0.0.1:3000');
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Requests with no Origin header (native mobile apps, curl, server-to-server) are allowed;
      // browser-origin requests must match the configured allowlist exactly.
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} is not permitted by CORS policy.`), false);
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Client-Platform, X-Requested-With',
  });

  // Global Pipes, Filters, and Interceptors
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // Swagger OpenAPI Documentation — never exposed in production unless explicitly opted in.
  const swaggerEnabled = !isProduction || process.env.ENABLE_SWAGGER === 'true';
  if (swaggerEnabled) {
  const config = new DocumentBuilder()
    .setTitle('JBIT Dehradun — Campus ERP Ecosystem API')
    .setDescription(
      'Production-grade RESTful and WebSocket API powering the Next.js Web ERP, Student Mobile App, and Faculty Mobile Hub for JB Institute of Technology, Dehradun (Affiliated to UTU / SDSUV / UBTER, Approved by AICTE).',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter institutional JWT Access Token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication & Identity', 'SSO, login, OTP verification, and role session management')
    .addTag('Students & Debarment Management', 'Student records, KYC, and UTU Ordinance 14(B) debarment')
    .addTag('Faculty Academic Hub', 'Faculty cadre, teaching workloads, and AICTE compliance')
    .addTag('Attendance & QR Hub', 'Geofenced rotating QR attendance, bulk roster marking, and statutory 75% calculation')
    .addTag('Timetable Engine', 'Automated clash-detection scheduling for rooms, labs, and faculty')
    .addTag('Examinations & Seating Matrix', 'UTU seating matrix generation, mark locking, and SGPA/CGPA engine')
    .addTag('Fee Ledger & Payment Gateway', 'Semester fee structures, Razorpay orders, webhooks, and receipts')
    .addTag('Training & Placement Cell (TPO)', 'Corporate recruitment drives, eligibility rules, and LOI signing')
    .addTag('JBIT AI Campus Copilot', 'Grounded conversational academic assistant')
    .addTag('System Health', 'API operational status, database connectivity, and cloud node metrics')
    .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'JBIT ERP — API Documentation',
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  const port = process.env.PORT || 8000;
  await app.listen(port);

  logger.log(`==================================================================`);
  logger.log(`🎓 JBIT Campus ERP Backend Server started successfully on port ${port}`);
  logger.log(`📡 API Base URL:       http://localhost:${port}/api/v1`);
  if (swaggerEnabled) {
    logger.log(`📚 Swagger OpenAPI UI: http://localhost:${port}/api/docs`);
  }
  logger.log(`==================================================================`);
}

bootstrap();
