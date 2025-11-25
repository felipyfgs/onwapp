import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PinoLoggerService } from './logger/logger.service';
import { DatabaseModule } from './database/database.module';
import { SessionsModule } from './api/sessions/sessions.module';
import { MessagesModule } from './api/messages/messages.module';
import { GroupsModule } from './api/groups/groups.module';
import { ContactsModule } from './api/contacts/contacts.module';
import { ProfileModule } from './api/profile/profile.module';
import { ChatsModule } from './api/chats/chats.module';
import { PresenceModule } from './api/presence/presence.module';
import { MediaModule } from './api/media/media.module';
import { SettingsModule } from './api/settings/settings.module';
import { WebhooksModule } from './integrations/webhooks/webhooks.module';
import { ChatwootModule } from './integrations/chatwoot/chatwoot.module';
import { PersistenceModule } from './core/persistence/persistence.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    SessionsModule,
    MessagesModule,
    GroupsModule,
    ContactsModule,
    ProfileModule,
    ChatsModule,
    PresenceModule,
    MediaModule,
    SettingsModule,
    WebhooksModule,
    ChatwootModule,
    PersistenceModule,
  ],
  providers: [PinoLoggerService],
  exports: [PinoLoggerService],
})
export class AppModule {}
