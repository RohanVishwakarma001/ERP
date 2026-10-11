import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Placeholder values shipped in .env.example that must never be treated as real credentials. */
const PLACEHOLDER_PATTERN = /mock|replace-with|changeme/i;

function isRealCredential(value: string | undefined): value is string {
  return Boolean(value && value.trim() && !PLACEHOLDER_PATTERN.test(value));
}

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
}

export interface StorageConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export interface PaymentConfig {
  keyId: string;
  keySecret: string;
  webhookSecret?: string;
}

/**
 * Typed, validated access to configuration. Modules read settings through this
 * class rather than `process.env` or stringly-typed `ConfigService.get()` calls,
 * so renaming a variable is a one-file change. See `env.validation.ts`.
 */
@Injectable()
export class AppConfig {
  constructor(private readonly config: ConfigService) {}

  get nodeEnv(): 'development' | 'test' | 'production' {
    return this.config.get('NODE_ENV', 'development');
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get port(): number {
    return Number(this.config.get('PORT', 8000));
  }

  /**
   * Base URL used for logging and external links.
   * In production, prefers Render's injected RENDER_EXTERNAL_URL or PUBLIC_URL.
   * In development/test, defaults to local host and configured port.
   */
  get baseUrl(): string {
    if (this.isProduction) {
      const externalUrl =
        this.config.get<string>('RENDER_EXTERNAL_URL') ||
        this.config.get<string>('PUBLIC_URL');
      if (externalUrl && externalUrl.trim()) {
        return externalUrl.trim().replace(/\/+$/, '');
      }
    }
    return `http://localhost:${this.port}`;
  }

  get swaggerEnabled(): boolean {
    return !this.isProduction || this.config.get<boolean>('ENABLE_SWAGGER', false) === true;
  }

  /** Reverse-proxy hops to trust for client IPs (0 = none). */
  get trustProxy(): number {
    return Number(this.config.get('TRUST_PROXY', 0));
  }

  get jwtAccessSecret(): string {
    return this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
  }

  get jwtRefreshSecret(): string {
    return this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  /** `null` when SMTP is not fully configured. */
  get smtp(): SmtpConfig | null {
    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<number>('SMTP_PORT');
    const user = this.config.get<string>('SMTP_USER');
    const password = this.config.get<string>('SMTP_PASSWORD');
    if (!host || !port || !isRealCredential(user) || !isRealCredential(password)) return null;
    return { host, port: Number(port), user, password, from: this.config.get<string>('SMTP_FROM') };
  }

  /** `null` when Cloudinary credentials are absent or placeholders. */
  get storage(): StorageConfig | null {
    const cloudName = this.config.get<string>('STORAGE_BUCKET');
    const apiKey = this.config.get<string>('STORAGE_ACCESS_KEY');
    const apiSecret = this.config.get<string>('STORAGE_SECRET_KEY');
    if (!cloudName || !isRealCredential(apiKey) || !isRealCredential(apiSecret)) return null;
    return { cloudName, apiKey, apiSecret };
  }

  /** `null` when Razorpay keys are absent or placeholders. */
  get payment(): PaymentConfig | null {
    const keyId = this.config.get<string>('PAYMENT_KEY_ID');
    const keySecret = this.config.get<string>('PAYMENT_KEY_SECRET');
    if (!isRealCredential(keyId) || !isRealCredential(keySecret)) return null;
    const webhookSecret = this.config.get<string>('PAYMENT_WEBHOOK_SECRET');
    return { keyId, keySecret, webhookSecret: isRealCredential(webhookSecret) ? webhookSecret : undefined };
  }
}
