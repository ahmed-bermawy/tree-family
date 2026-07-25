import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: 'no-reply@bermawy.info',
        pass: 'j8fy-nkb9-qfed-aanc',
      },
    });
  }

  async sendPasswordReset(email: string, resetLink: string, lang?: string) {
    const isAr = lang?.startsWith('ar');
    const subject = isAr ? 'إعادة تعيين كلمة المرور - شجرة العائلة' : 'Password Reset - Family Tree';
    const html = isAr ? this.arTemplate(resetLink) : this.enTemplate(resetLink);

    return this.transporter.sendMail({
      from: '"Family Tree" <no-reply@bermawy.info>',
      to: email,
      subject,
      html,
    });
  }

  private enTemplate(link: string) {
    return `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#111;border-radius:12px;color:#eee;border:1px solid #333">
        <div style="text-align:center;font-size:32px;margin-bottom:12px">🌳</div>
        <h2 style="text-align:center;color:#fff;margin:0 0 6px">Password Reset</h2>
        <p style="text-align:center;color:#999;font-size:14px;margin:0 0 20px">Click the button below to reset your password</p>
        <a href="${link}" style="display:block;text-align:center;padding:12px 24px;background:#059669;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;margin:0 auto 20px;max-width:200px">Reset Password</a>
        <p style="text-align:center;color:#666;font-size:12px">Or copy this link:<br><a href="${link}" style="color:#34d399;font-size:12px;word-break:break-all">${link}</a></p>
        <p style="text-align:center;color:#555;font-size:11px;margin-top:20px">This link expires in 1 hour.</p>
      </div>`;
  }

  private arTemplate(link: string) {
    return `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#111;border-radius:12px;color:#eee;border:1px solid #333;direction:rtl">
        <div style="text-align:center;font-size:32px;margin-bottom:12px">🌳</div>
        <h2 style="text-align:center;color:#fff;margin:0 0 6px">إعادة تعيين كلمة المرور</h2>
        <p style="text-align:center;color:#999;font-size:14px;margin:0 0 20px">اضغط على الزر أدناه لإعادة تعيين كلمة المرور الخاصة بك</p>
        <a href="${link}" style="display:block;text-align:center;padding:12px 24px;background:#059669;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;margin:0 auto 20px;max-width:200px">إعادة تعيين كلمة المرور</a>
        <p style="text-align:center;color:#666;font-size:12px">أو انسخ هذا الرابط:<br><a href="${link}" style="color:#34d399;font-size:12px;word-break:break-all">${link}</a></p>
        <p style="text-align:center;color:#555;font-size:11px;margin-top:20px">هذا الرابط صالح لمدة ساعة واحدة.</p>
      </div>`;
  }

  async test(email: string) {
    return this.transporter.sendMail({
      from: '"Family Tree" <no-reply@bermawy.info>',
      to: email,
      subject: '✅ Test Email from Family Tree',
      html: '<h2>Test successful!</h2><p>Your email configuration is working.</p>',
    });
  }
}
