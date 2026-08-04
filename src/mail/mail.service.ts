import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.hostinger.com',
      port: Number(process.env.MAIL_PORT) || 465,
      secure: process.env.MAIL_SECURE !== 'false',
      auth: {
        user: process.env.MAIL_USER || '',
        pass: process.env.MAIL_PASS || '',
      },
    });
  }

  private get fromAddress() {
    return process.env.MAIL_FROM || '"Family Tree" <noreply@bermawy.tech>';
  }

  async sendPasswordReset(email: string, resetLink: string, lang?: string) {
    const isAr = lang?.startsWith('ar');
    const subject = isAr ? 'إعادة تعيين كلمة المرور - شجرة العائلة' : 'Password Reset - Family Tree';
    const html = isAr ? this.arTemplate(resetLink) : this.enTemplate(resetLink);

    return this.transporter.sendMail({
      from: this.fromAddress,
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
      from: this.fromAddress,
      to: email,
      subject: '✅ Test Email from Family Tree',
      html: '<h2>Test successful!</h2><p>Your email configuration is working.</p>',
    });
  }

  async sendFeedback(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
    imagePath?: string;
    imageName?: string;
  }) {
    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#111;border-radius:12px;color:#eee;border:1px solid #333">
        <div style="text-align:center;font-size:32px;margin-bottom:12px">💬</div>
        <h2 style="text-align:center;color:#fff;margin:0 0 16px">New Feedback</h2>
        <table style="width:100%;font-size:14px;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#999;width:90px"><strong>Name</strong></td><td style="padding:6px 0;color:#fff">${this.escapeHtml(data.name)}</td></tr>
          <tr><td style="padding:6px 0;color:#999"><strong>Email</strong></td><td style="padding:6px 0;color:#34d399">${this.escapeHtml(data.email)}</td></tr>
          <tr><td style="padding:6px 0;color:#999"><strong>Subject</strong></td><td style="padding:6px 0;color:#fff">${this.escapeHtml(data.subject)}</td></tr>
        </table>
        <div style="margin-top:16px;padding:14px;background:#1a1a1a;border-radius:8px;border:1px solid #333;white-space:pre-wrap;color:#ddd;font-size:14px">${this.escapeHtml(data.message)}</div>
        <p style="text-align:center;color:#555;font-size:11px;margin-top:20px">Sent via the Family Tree feedback form</p>
      </div>`;

    return this.transporter.sendMail({
      from: this.fromAddress,
      to: process.env.FEEDBACK_EMAIL || 'ahmed@bermawy.tech',
      replyTo: data.email,
      subject: `💬 Feedback: ${data.subject.slice(0, 80)}`,
      html,
      attachments: data.imagePath
        ? [{ filename: data.imageName || 'feedback-image', path: data.imagePath }]
        : [],
    });
  }

  private escapeHtml(text: string): string {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
