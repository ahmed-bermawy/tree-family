import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'feedback');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

@Controller()
export class FeedbackController {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  // ---------- Public: submit feedback ----------
  @Post('feedback')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + extname(file.originalname));
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|webp|gif)$/)) {
          cb(new BadRequestException('Only images allowed (jpg, png, webp, gif)'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async submit(
    @Body() body: { name?: string; email?: string; subject?: string; message?: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const name = (body.name || '').trim();
    const email = (body.email || '').trim();
    const subject = (body.subject || '').trim();
    const message = (body.message || '').trim();

    if (!name || !email || !subject || !message) {
      throw new BadRequestException('Name, email, subject and message are required');
    }
    if (!email.includes('@')) {
      throw new BadRequestException('Invalid email address');
    }

    // Save to database
    const feedback = await this.prisma.feedback.create({
      data: {
        name,
        email,
        subject,
        message,
        imageUrl: file ? `/uploads/feedback/${file.filename}` : null,
      },
    });

    // Send email notification (non-fatal if it fails)
    try {
      await this.mailService.sendFeedback({
        name,
        email,
        subject,
        message,
        imagePath: file ? join(UPLOAD_DIR, file.filename) : undefined,
        imageName: file ? file.originalname : undefined,
      });
    } catch (err) {
      console.error('Feedback email failed (saved to DB):', err.message);
    }

    return { message: 'Feedback sent. Thank you!', id: feedback.id };
  }

  // ---------- Admin: list feedback ----------
  @Get('dashboard/api/feedback')
  @UseGuards(JwtAuthGuard, AdminGuard)
  list(@Query('status') status?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    const where = status ? { status: status as never } : {};
    return this.prisma.feedback.findMany({
      where,
      orderBy: [
        { status: 'asc' }, // NEW first, then DONE, then ARCHIVED
        { createdAt: 'desc' },
      ],
      skip: ((Number(page) || 1) - 1) * (Number(limit) || 50),
      take: Number(limit) || 50,
    });
  }

  // ---------- Admin: update feedback (priority/status) ----------
  @Patch('dashboard/api/feedback/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { priority?: string; status?: string },
  ) {
    const existing = await this.prisma.feedback.findUnique({ where: { id } });
    if (!existing) throw new BadRequestException('Feedback not found');

    const data: { priority?: never; status?: never } = {};
    if (body.priority) {
      if (!['LOW', 'MEDIUM', 'HIGH'].includes(body.priority)) {
        throw new BadRequestException('Invalid priority');
      }
      (data as any).priority = body.priority;
    }
    if (body.status) {
      if (!['NEW', 'DONE', 'ARCHIVED'].includes(body.status)) {
        throw new BadRequestException('Invalid status');
      }
      (data as any).status = body.status;
    }

    return this.prisma.feedback.update({ where: { id }, data: data as any });
  }

  // ---------- Admin: delete feedback ----------
  @Delete('dashboard/api/feedback/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async remove(@Param('id', ParseIntPipe) id: number) {
    const existing = await this.prisma.feedback.findUnique({ where: { id } });
    if (!existing) throw new BadRequestException('Feedback not found');

    // Clean up attached image
    if (existing.imageUrl) {
      try {
        const filePath = join(process.cwd(), existing.imageUrl.replace(/^\//, ''));
        fs.unlinkSync(filePath);
      } catch {}
    }

    await this.prisma.feedback.delete({ where: { id } });
    return { message: 'Feedback deleted' };
  }
}
