import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { extname, join } from 'path';

import { BadRequestException, Injectable } from '@nestjs/common';

import {
  UPLOAD_ALLOWED_MIME,
  UPLOAD_MAX_BYTES,
  UPLOAD_PRODUCTS_DIR,
  UPLOAD_PRODUCTS_URL_PREFIX,
} from './uploads.constants';
import type { UploadImageResponseDto } from './dto/uploads-response.dto';

const SAFE_EXT_BY_MIME: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

@Injectable()
export class UploadsService {
  saveProductImage(file: Express.Multer.File): UploadImageResponseDto {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }
    if (!UPLOAD_ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type. Allowed: ${UPLOAD_ALLOWED_MIME.join(', ')}`,
      );
    }
    if (file.size > UPLOAD_MAX_BYTES) {
      throw new BadRequestException(
        `File too large. Max size is ${UPLOAD_MAX_BYTES / (1024 * 1024)}MB.`,
      );
    }

    if (!existsSync(UPLOAD_PRODUCTS_DIR)) {
      mkdirSync(UPLOAD_PRODUCTS_DIR, { recursive: true });
    }

    const safeExt =
      SAFE_EXT_BY_MIME[file.mimetype] ?? extname(file.originalname || '').toLowerCase();
    const filename = `${randomUUID()}${safeExt}`;
    const fullPath = join(UPLOAD_PRODUCTS_DIR, filename);
    writeFileSync(fullPath, file.buffer);

    return {
      url: `${UPLOAD_PRODUCTS_URL_PREFIX}/${filename}`,
      filename,
      size: file.size,
      mimeType: file.mimetype,
    };
  }
}
