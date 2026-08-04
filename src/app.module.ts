import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TreesModule } from './trees/trees.module';
import { PersonsModule } from './persons/persons.module';
import { RelationshipsModule } from './relationships/relationships.module';
import { UploadModule } from './upload/upload.module';
import { StatsModule } from './stats/stats.module';
import { AdminsModule } from './admins/admins.module';
import { ViewsModule } from './views/views.module';
import { FeedbackModule } from './feedback/feedback.module';

@Module({
  imports: [PrismaModule, AuthModule, TreesModule, PersonsModule, RelationshipsModule, UploadModule, StatsModule, AdminsModule, ViewsModule, FeedbackModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
