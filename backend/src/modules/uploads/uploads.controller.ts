import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StorageService } from '../common/storage/storage.service';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
]);

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

@ApiTags('File Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly storageService: StorageService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a file (assignment submission, document, avatar) to cloud storage' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File, @Query('folder') folder?: string) {
    if (!file) {
      throw new BadRequestException('No file provided.');
    }
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
    }

    const safeFolder = (folder || 'general').replace(/[^a-zA-Z0-9_-]/g, '');
    const uploaded = await this.storageService.uploadBuffer(file.buffer, safeFolder, file.originalname);

    return {
      url: uploaded.url,
      publicId: uploaded.publicId,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: uploaded.bytes,
    };
  }
}
