import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [HttpModule, PrismaModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
