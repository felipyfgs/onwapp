import { Module } from '@nestjs/common';
import { WhaileysModule } from './core/whaileys/whaileys.module';
import { SessionsModule } from './api/sessions/sessions.module';
import { MessagesModule } from './api/messages/messages.module';
import { GroupsModule } from './api/groups/groups.module';
import { ChatsModule } from './api/chats/chats.module';
import { ContactsModule } from './api/contacts/contacts.module';
import { ProfilesModule } from './api/profiles/profiles.module';
import { WebhookModule } from './integrations/webhook/webhook.module';
import { DatabaseModule } from './database/database.module';
import { LoggerModule } from './logger/logger.module';

@Module({
  imports: [
    DatabaseModule,
    LoggerModule,
    WebhookModule,
    WhaileysModule,
    SessionsModule,
    MessagesModule,
    GroupsModule,
    ChatsModule,
    ContactsModule,
    ProfilesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
