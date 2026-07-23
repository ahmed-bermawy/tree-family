import {
  Controller, Post, Param, ParseIntPipe,
  UseInterceptors, UploadedFile, BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

// Ensure upload dir exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

@Controller('upload')
export class UploadController {
  constructor(private prisma: PrismaService) {}

  @Post(':personId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + extname(file.originalname));
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB (cropped before upload)
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|webp|gif)$/)) {
          cb(new BadRequestException('Only images allowed (jpg, png, webp, gif)'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async uploadPhoto(
    @Param('personId', ParseIntPipe) personId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const photoUrl = `/uploads/${file.filename}`;
    await this.prisma.person.update({
      where: { id: personId },
      data: { photo: photoUrl },
    });
    return { photoUrl };
  }
}
