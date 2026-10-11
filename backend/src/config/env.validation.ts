import * as Joi from 'joi';

/** Values copied from .env.example that must never reach a deployed server. */
const PLACEHOLDER_SECRET = /replace-with|changeme|mock|^(.)\1+$/i;

const jwtSecret = Joi.string()
  .min(32)
  .required()
  .when('NODE_ENV', {
    is: 'production',
    then: Joi.string()
      .min(48)
      .pattern(PLACEHOLDER_SECRET, { invert: true, name: 'non-placeholder' })
      // Never echo the value: these errors land in deploy logs.
      .messages({ 'string.pattern.invert.name': '{{#label}} looks like a placeholder; generate a random secret' }),
  });

/**
 * Single source of truth for every environment variable the backend reads.
 *
 * The app refuses to boot if a required variable is missing or malformed, so
 * misconfiguration fails at deploy time instead of at the first request that
 * happens to touch it. Optional integrations (SMTP, Cloudinary, Razorpay) may be
 * absent — their services detect that and degrade explicitly (log / 503).
 */
export const envValidationSchema = Joi.object({
  // Runtime
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(8000),
  RENDER_EXTERNAL_URL: Joi.string().uri().allow('').optional(),
  PUBLIC_URL: Joi.string().uri().allow('').optional(),

  // Clients & CORS
  WEB_URL: Joi.string().uri().required(),
  CORS_ORIGINS: Joi.string().allow('').default(''),
  MOBILE_APP_SCHEME: Joi.string().optional(),
  ENABLE_SWAGGER: Joi.boolean().truthy('true').falsy('false').default(false),
  // Number of reverse-proxy hops in front of the API (Render/Railway/Nginx = 1). Lets
  // rate limiting see the real client IP; leave 0 when the API is exposed directly,
  // otherwise clients could spoof X-Forwarded-For to dodge throttling.
  TRUST_PROXY: Joi.number().integer().min(0).max(5).default(0),

  // Database
  DATABASE_URL: Joi.string().uri().required(),
  DIRECT_URL: Joi.string().uri().optional(),

  // Auth
  // Production: ≥48 chars, not a placeholder. Access and refresh secrets must differ
  // (otherwise a refresh token would verify as an access token).
  JWT_ACCESS_SECRET: jwtSecret,
  JWT_REFRESH_SECRET: jwtSecret.invalid(Joi.ref('JWT_ACCESS_SECRET')).messages({
    'any.invalid': 'JWT_REFRESH_SECRET must differ from JWT_ACCESS_SECRET',
  }),

  // Email (optional — OTPs are logged instead of sent when absent)
  SMTP_HOST: Joi.string().allow('').optional(),
  SMTP_PORT: Joi.number().port().optional(),
  SMTP_USER: Joi.string().allow('').optional(),
  SMTP_PASSWORD: Joi.string().allow('').optional(),
  SMTP_FROM: Joi.string().default('JBIT ERP <erp@jbitdoon.edu.in>'),

  // File storage — Cloudinary (optional — uploads return 503 when absent)
  STORAGE_BUCKET: Joi.string().allow('').optional(),
  STORAGE_ACCESS_KEY: Joi.string().allow('').optional(),
  STORAGE_SECRET_KEY: Joi.string().allow('').optional(),

  // Payments — Razorpay (optional — payment endpoints return 503 when absent)
  PAYMENT_KEY_ID: Joi.string().allow('').optional(),
  PAYMENT_KEY_SECRET: Joi.string().allow('').optional(),
  PAYMENT_WEBHOOK_SECRET: Joi.string().allow('').optional(),
}).unknown(true);
