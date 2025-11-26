import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { PinoLoggerService } from './logger/logger.service';
import { DatabaseModule } from './database/database.module';
import { SharedServicesModule } from './common/services/services.module';
import { SessionsModule } from './api/sessions/sessions.module';
import { MessagesModule } from './api/messages/messages.module';
import { GroupsModule } from './api/groups/groups.module';
import { ContactsModule } from './api/contacts/contacts.module';
import { ProfileModule } from './api/profile/profile.module';
import { ChatsModule } from './api/chats/chats.module';
import { PresenceModule } from './api/presence/presence.module';
import { MediaModule } from './api/media/media.module';
import { SettingsModule } from './api/settings/settings.module';
import { CallsModule } from './api/calls/calls.module';
import { NewslettersModule } from './api/newsletters/newsletters.module';
import { BusinessModule } from './api/business/business.module';
import { LabelsModule } from './api/labels/labels.module';
import { CommunitiesModule } from './api/communities/communities.module';
import { WebhooksModule } from './integrations/webhooks/webhooks.module';
import { ChatwootModule } from './integrations/chatwoot/chatwoot.module';
import { PersistenceModule } from './core/persistence/persistence.module';
import { AudioModule } from './core/audio/audio.module';
import { AllExceptionsFilter } from './common/filters';
import { LoggingInterceptor, TimeoutInterceptor } from './common/interceptors';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    SharedServicesModule,
    SessionsModule,
    MessagesModule,
    GroupsModule,
    ContactsModule,
    ProfileModule,
    ChatsModule,
    PresenceModule,
    MediaModule,
    SettingsModule,
    CallsModule,
    NewslettersModule,
    BusinessModule,
    LabelsModule,
    CommunitiesModule,
    WebhooksModule,
    ChatwootModule,
    PersistenceModule,
    AudioModule,
  ],
  providers: [
    PinoLoggerService,
    // Global exception filter for consistent error responses
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // Global logging interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // Global timeout interceptor (30s default)
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor,
    },
  ],
  exports: [PinoLoggerService],
})
export class AppModule {}
