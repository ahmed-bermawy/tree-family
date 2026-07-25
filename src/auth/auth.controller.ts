import { Controller, Post, Get, Body, UseGuards, Request, Headers, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from '../mail/mail.service';

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
    return req.user;
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
