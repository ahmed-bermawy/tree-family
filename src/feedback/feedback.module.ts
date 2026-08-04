import { Module } from '@nestjs/common';
import { FeedbackController } from './feedback.controller';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [FeedbackController],
})
export class FeedbackModule {}
