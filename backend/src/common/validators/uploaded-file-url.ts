import { applyDecorators } from '@nestjs/common';
import { IsUrl, MaxLength } from 'class-validator';

/** Hosts our StorageService uploads to. Stored file links must point here. */
export const TRUSTED_FILE_HOSTS = ['res.cloudinary.com'];

/**
 * A link to a file previously uploaded via POST /uploads. Restricting the
 * scheme to https blocks `javascript:`/`data:` URLs (stored XSS when rendered as
 * a link) and the host allowlist stops users pointing staff at arbitrary sites.
 */
export const IsUploadedFileUrl = () =>
  applyDecorators(
    MaxLength(2048),
    IsUrl(
      { protocols: ['https'], require_protocol: true, host_whitelist: TRUSTED_FILE_HOSTS },
      { message: 'Must be a link returned by the file upload endpoint.' },
    ),
  );
