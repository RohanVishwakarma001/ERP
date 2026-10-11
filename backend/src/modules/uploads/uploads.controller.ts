import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { UPLOAD_TYPES, extensionOf, matchesSignature, sanitizeFilename } from './file-signature';

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

/** Destination folders clients may choose; anything else lands in `general`. */
const ALLOWED_FOLDERS = new Set(['general', 'assignments', 'documents', 'avatars', 'leave', 'petitions']);

@ApiTags('File Uploads')
@ApiBearerAuth()
@Controller('uploads')
export class UploadsController {
  constructor(private readonly storageService: StorageService) {}

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a file (assignment submission, document, avatar) to cloud storage' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1, fields: 5, parts: 6 },
      // Reject disallowed types before the body is buffered into memory.
      fileFilter: (_req, file, cb) =>
        UPLOAD_TYPES[file.mimetype]
          ? cb(null, true)
          : cb(new BadRequestException(`Unsupported file type: ${file.mimetype}`), false),
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File, @Query('folder') folder?: string) {
    if (!file) {
      throw new BadRequestException('No file provided.');
    }

    const type = UPLOAD_TYPES[file.mimetype];
    const filename = sanitizeFilename(file.originalname);
    if (!type || !type.extensions.includes(extensionOf(filename))) {
      throw new BadRequestException('File extension does not match its declared type.');
    }
    if (!matchesSignature(file.buffer, file.mimetype)) {
      throw new BadRequestException('File content does not match its declared type.');
    }

    const safeFolder = folder && ALLOWED_FOLDERS.has(folder) ? folder : 'general';
    const uploaded = await this.storageService.uploadBuffer(file.buffer, safeFolder, filename);

    return {
      url: uploaded.url,
      publicId: uploaded.publicId,
      originalName: filename,
      mimeType: file.mimetype,
      sizeBytes: uploaded.bytes,
    };
  }
}
