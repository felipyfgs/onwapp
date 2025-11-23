import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PinoLoggerService } from './logger/logger.service';
import { PrismaModule } from './prisma/prisma.module';
import { SessionsModule } from './sessions/sessions.module';
import { MessagesModule } from './messages/messages.module';
import { GroupsModule } from './groups/groups.module';
import { ContactsModule } from './contacts/contacts.module';
import { ProfileModule } from './profile/profile.module';
import { ChatsModule } from './chats/chats.module';
import { PresenceModule } from './presence/presence.module';
import { MediaModule } from './media/media.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    SessionsModule,
    MessagesModule,
    GroupsModule,
    ContactsModule,
    ProfileModule,
    ChatsModule,
    PresenceModule,
    MediaModule,
    SettingsModule,
  ],
  providers: [PinoLoggerService],
  exports: [PinoLoggerService],
})
export class AppModule {}
