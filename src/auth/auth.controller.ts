import { Controller, Post, Get, Patch, Body, UseGuards, Request, Headers, Param, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from '../mail/mail.service';

const AVATAR_DIR = join(process.cwd(), 'uploads', 'avatars');

if (!fs.existsSync(AVATAR_DIR)) {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private mailService: MailService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(@Request() req: any, @Body() dto: { name?: string; email?: string }) {
    return this.authService.updateProfile(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile/password')
  changePassword(
    @Request() req: any,
    @Body() dto: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: AVATAR_DIR,
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
  async uploadAvatar(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    return this.authService.updateAvatar(req.user.id, avatarUrl);
  }

  @Post('forgot-password')
  async forgotPassword(
    @Body('email') email: string,
    @Headers('accept-language') lang?: string,
  ) {
    const result = await this.authService.forgotPassword(email, lang);
    if (result.resetLink) {
      await this.mailService.sendPasswordReset(email, result.resetLink, lang)
        .catch((err) => console.error('Email send failed:', err.message));
    }
    return result;
  }

  @Post('test-email')
  async testEmail(@Body('email') email: string) {
    await this.mailService.test(email);
    return { sent: true };
  }

  @Post('reset-password/:token')
  resetPassword(
    @Param('token') token: string,
    @Body('password') password: string,
  ) {
    return this.authService.resetPassword(token, password);
  }
}
