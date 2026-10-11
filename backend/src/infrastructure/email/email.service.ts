import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromAddress: string;

  constructor(private configService: ConfigService) {
    this.fromAddress = this.configService.get<string>('SMTP_FROM', 'JBIT ERP <erp@jbitdoon.edu.in>');

    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASSWORD');

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465,
        auth: { user, pass },
      });
    } else {
      this.logger.warn(
        'SMTP is not fully configured (SMTP_HOST/PORT/USER/PASSWORD). Outbound email is disabled — OTP codes will only be written to the application log.',
      );
    }
  }

  async sendOtpEmail(to: string, code: string, purpose: 'PASSWORD_RESET' | 'LOGIN_2FA'): Promise<void> {
    const subject =
      purpose === 'PASSWORD_RESET'
        ? 'JBIT Campus ERP — Password Reset Code'
        : 'JBIT Campus ERP — Login Verification Code';

    const text = `Your JBIT Campus ERP verification code is ${code}. It expires in 10 minutes. If you did not request this, you can safely ignore this email.`;
    const html = `<p>Your JBIT Campus ERP verification code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${code}</p><p>This code expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>`;

    if (!this.transporter) {
      this.logger.warn(
        `SMTP disabled — would have emailed OTP code to ${to} for ${purpose}. Configure SMTP_* env vars to enable real delivery.`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({ from: this.fromAddress, to, subject, text, html });
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${to}: ${error.message}`);
      throw error;
    }
  }
}
