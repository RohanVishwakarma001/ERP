import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, ValidationPipe, INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppConfig, corsOriginCheck } from './config';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

export const API_PREFIX = 'api/v1';

function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('JBIT Dehradun — Campus ERP API')
    .setDescription('REST and WebSocket API powering the JBIT Campus ERP web and mobile clients.')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' }, 'JWT-auth')
    .build();

  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config), {
    customSiteTitle: 'JBIT ERP — API Documentation',
    swaggerOptions: { persistAuthorization: true },
  });
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  // rawBody is required to verify Razorpay's webhook HMAC over the exact request bytes.
  // bodyParser is re-registered below with explicit size limits.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true, bodyParser: false });
  const config = app.get(AppConfig);

  // Cap request bodies so a single request can't exhaust memory. File uploads are
  // multipart and bounded separately by multer in UploadsController.
  app.useBodyParser('json', { limit: '1mb' });
  app.useBodyParser('urlencoded', { limit: '1mb', extended: true });

  // Behind a reverse proxy, trust exactly that many hops so rate limiting keys on the
  // real client IP — never `true`, which would let clients spoof X-Forwarded-For.
  if (config.trustProxy > 0) app.set('trust proxy', config.trustProxy);
  app.disable('x-powered-by');

  app.use(
    helmet({
      // JSON API: nothing should ever render or frame its responses. Swagger UI (non-prod
      // by default) needs inline scripts/styles, so the strict CSP applies when it's off.
      contentSecurityPolicy: config.swaggerEnabled
        ? undefined
        : { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"], baseUri: ["'none'"], formAction: ["'none'"] } },
      crossOriginResourcePolicy: { policy: 'same-site' },
      hsts: config.isProduction ? { maxAge: 31_536_000, includeSubDomains: true } : false,
    }),
  );
  app.setGlobalPrefix(API_PREFIX);
  app.enableCors({
    origin: corsOriginCheck,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Client-Platform, X-Requested-With',
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new GlobalHttpExceptionFilter(config.isProduction));
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());
  app.enableShutdownHooks();

  if (config.swaggerEnabled) setupSwagger(app);

  await app.listen(config.port, '0.0.0.0');
  logger.log(`API listening on ${config.baseUrl}/${API_PREFIX} (${config.nodeEnv})`);
  if (config.swaggerEnabled) logger.log(`Swagger UI: ${config.baseUrl}/api/docs`);
}

bootstrap();
