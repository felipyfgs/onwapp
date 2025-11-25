import { Module, Global } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { SessionRepository } from './repositories/session.repository';
import { SessionSettingsRepository } from './repositories/session-settings.repository';
import { MessageRepository } from './repositories/message.repository';
import { ChatRepository } from './repositories/chat.repository';
import { ContactRepository } from './repositories/contact.repository';
import { WebhookRepository } from './repositories/webhook.repository';
import { AuthStateRepository } from './repositories/auth-state.repository';

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
