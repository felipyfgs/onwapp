import { Module, Global } from '@nestjs/common';
import { DatabaseService } from './database.service';
import {
  SessionRepository,
  SessionSettingsRepository,
  MessageRepository,
  ChatRepository,
  ContactRepository,
  WebhookRepository,
  AuthStateRepository,
} from './repositories';

@Global()
@Module({
  providers: [
    DatabaseService,
    SessionRepository,
    SessionSettingsRepository,
    MessageRepository,
    ChatRepository,
    ContactRepository,
    WebhookRepository,
    AuthStateRepository,
  ],
  exports: [
    DatabaseService,
    SessionRepository,
    SessionSettingsRepository,
    MessageRepository,
    ChatRepository,
    ContactRepository,
    WebhookRepository,
    AuthStateRepository,
  ],
})
export class DatabaseModule {}
