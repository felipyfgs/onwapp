import { Module } from '@nestjs/common';
import { WhaileysModule } from './core/whaileys/whaileys.module';
import { SessionModule } from './api/session/session.module';
import { MessageModule } from './api/message/message.module';
import { GroupModule } from './api/group/group.module';
import { ChatModule } from './api/chat/chat.module';
import { ContactModule } from './api/contact/contact.module';
import { ProfileModule } from './api/profile/profile.module';
import { WebhookModule } from './integrations/webhook/webhook.module';
import { DatabaseModule } from './database/database.module';
import { LoggerModule } from './logger/logger.module';

@Module({
  imports: [
    DatabaseModule,
    LoggerModule,
    WebhookModule,
    WhaileysModule,
    SessionModule,
    MessageModule,
    GroupModule,
    ChatModule,
    ContactModule,
    ProfileModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
