import {
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtService } from '@nestjs/jwt';
import { memoryStorage } from 'multer';
import type { Request } from 'express';

import { getUserIdFromRequest } from '../../common/auth/request-user.helper';
import { UPLOAD_MAX_BYTES } from './uploads.constants';
import { UploadsService } from './uploads.service';
import type { UploadImageResponseDto } from './dto/uploads-response.dto';

@Controller('uploads')
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: UPLOAD_MAX_BYTES },
    }),
  )
  uploadImage(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ): UploadImageResponseDto {
    getUserIdFromRequest(req, this.jwtService);
    return this.uploadsService.saveProductImage(file);
  }
}
