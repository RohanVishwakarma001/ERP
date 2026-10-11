import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { AppConfig } from '../../config';
import { maskIdentifier } from '../../common/utils/redact';

export type OtpPurpose = 'PASSWORD_RESET' | 'LOGIN_2FA';

const OTP_SUBJECTS: Record<OtpPurpose, string> = {
  PASSWORD_RESET: 'JBIT Campus ERP — Password Reset Code',
  LOGIN_2FA: 'JBIT Campus ERP — Login Verification Code',
};

/**
 * Outbound email over SMTP. When SMTP is not configured, sends are logged and
 * skipped (so local development works without a mail server) rather than failing.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter | null = null;
  private readonly fromAddress: string = '';

  constructor(config: AppConfig) {
    const smtp = config.smtp;
    if (!smtp) {
      this.logger.warn('SMTP is not configured (SMTP_HOST/PORT/USER/PASSWORD). Outbound email is disabled.');
      return;
    }
    this.fromAddress = smtp.from;
    this.transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465,
      auth: { user: smtp.user, pass: smtp.password },
    });
  }

  async sendOtpEmail(to: string, code: string, purpose: OtpPurpose): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`SMTP disabled — OTP email for ${purpose} to ${maskIdentifier(to)} was not sent.`);
      return;
    }

    const text = `Your JBIT Campus ERP verification code is ${code}. It expires in 10 minutes. If you did not request this, you can safely ignore this email.`;
    const html = `<p>Your JBIT Campus ERP verification code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${code}</p><p>This code expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>`;

    try {
      await this.transporter.sendMail({ from: this.fromAddress, to, subject: OTP_SUBJECTS[purpose], text, html });
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${maskIdentifier(to)}: ${(error as Error).message}`);
      throw error;
    }
  }
}
