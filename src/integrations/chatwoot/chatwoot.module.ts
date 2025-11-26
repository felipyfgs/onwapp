import { Module, forwardRef } from '@nestjs/common';
import { ChatwootController } from './chatwoot.controller';
import { ChatwootService } from './chatwoot.service';
import { ChatwootRepository } from './chatwoot.repository';
import { ChatwootEventHandler } from './chatwoot-event.handler';
import { ChatwootClientFactory } from './chatwoot.client';
import {
  ChatwootConfigService,
  ChatwootContactService,
  ChatwootConversationService,
  ChatwootMessageService,
  ChatwootBotService,
  ChatwootImportService,
} from './services';
import { ChatwootWebhookHandler } from './handlers';
import { ChatwootPostgresClient } from './libs/chatwoot-postgres.client';
import { MessagesModule } from '../../api/messages/messages.module';
import { WhatsAppModule } from '../../core/whatsapp/whatsapp.module';
import { PersistenceModule } from '../../core/persistence/persistence.module';

/**
 * Chatwoot integration module
 *
 * Provides bidirectional integration between WhatsApp and Chatwoot.
 *
 * Key features:
 * - Configuration management for Chatwoot credentials and settings
 * - Contact synchronization between WhatsApp and Chatwoot
 * - Conversation management and status tracking
 * - Message forwarding in both directions
 * - Reply support (quoted messages)
 * - Media attachment handling
 */
@Module({
  imports: [
    forwardRef(() => MessagesModule),
    forwardRef(() => WhatsAppModule),
    PersistenceModule,
  ],
  controllers: [ChatwootController],
  providers: [
    // Repository
    ChatwootRepository,

    // Client factory
    ChatwootClientFactory,

    // PostgreSQL client for direct Chatwoot database access
    ChatwootPostgresClient,

    // Focused services
    ChatwootConfigService,
    ChatwootContactService,
    ChatwootConversationService,
    ChatwootMessageService,
    ChatwootBotService,
    ChatwootImportService,

    // Event handlers
    ChatwootEventHandler,
    ChatwootWebhookHandler,

    // Facade service (for backward compatibility)
    ChatwootService,
  ],
  exports: [
    // Export services for use in other modules
    ChatwootService,
    ChatwootEventHandler,
    ChatwootConfigService,
    ChatwootContactService,
    ChatwootConversationService,
    ChatwootMessageService,
    ChatwootBotService,
    ChatwootImportService,
    ChatwootPostgresClient,
  ],
})
export class ChatwootModule {}
