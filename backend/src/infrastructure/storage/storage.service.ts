import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export interface UploadedFile {
  url: string;
  publicId: string;
  resourceType: string;
  bytes: number;
  format?: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly configured: boolean;

  constructor(private configService: ConfigService) {
    const cloudName = this.configService.get<string>('STORAGE_BUCKET');
    const apiKey = this.configService.get<string>('STORAGE_ACCESS_KEY');
    const apiSecret = this.configService.get<string>('STORAGE_SECRET_KEY');

    this.configured = Boolean(cloudName && apiKey && apiSecret && apiKey !== 'mock-key');

    if (this.configured) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    } else {
      this.logger.warn(
        'Cloudinary storage is not configured (STORAGE_BUCKET/STORAGE_ACCESS_KEY/STORAGE_SECRET_KEY). File uploads will fail until configured.',
      );
    }
  }

  async uploadBuffer(buffer: Buffer, folder: string, originalName: string): Promise<UploadedFile> {
    if (!this.configured) {
      throw new ServiceUnavailableException('File storage is not configured on this server.');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `jbit-campus-erp/${folder}`,
          resource_type: 'auto',
          filename_override: originalName,
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error || !result) {
            this.logger.error(`Cloudinary upload failed: ${error?.message}`);
            reject(new ServiceUnavailableException('File upload failed. Please try again.'));
            return;
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: result.resource_type,
            bytes: result.bytes,
            format: result.format,
          });
        },
      );
      uploadStream.end(buffer);
    });
  }
}
