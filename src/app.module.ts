import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SessionModule } from './modules/session/session.module';
import { MessageModule } from './modules/message/message.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { WhatsModule } from './whats/whats.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    SessionModule,
    MessageModule,
    WebhookModule,
    WhatsModule,
  ],
})
export class AppModule { }
