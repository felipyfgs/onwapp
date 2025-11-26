import { Module, forwardRef } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { SocketManager } from './managers/socket.manager';
import {
  ConnectionHandler,
  MessagesHandler,
  ChatsHandler,
  HistoryHandler,
  LabelsHandler,
  GroupsExtendedHandler,
  NewsletterHandler,
  MiscHandler,
  ContactsHandler,
  GroupsPersistenceHandler,
  CallsHandler,
  PresenceHandler,
  BlocklistHandler,
} from './handlers';
import { WebhooksModule } from '../../integrations/webhooks/webhooks.module';
import { ChatwootModule } from '../../integrations/chatwoot/chatwoot.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { SettingsModule } from '../../api/settings/settings.module';

@Module({
  imports: [
    forwardRef(() => WebhooksModule),
    forwardRef(() => ChatwootModule),
    forwardRef(() => PersistenceModule),
    forwardRef(() => SettingsModule),
  ],
  providers: [
    WhatsAppService,
    SocketManager,
    ConnectionHandler,
    MessagesHandler,
    ChatsHandler,
    HistoryHandler,
    LabelsHandler,
    GroupsExtendedHandler,
    NewsletterHandler,
    MiscHandler,
    ContactsHandler,
    GroupsPersistenceHandler,
    CallsHandler,
    PresenceHandler,
    BlocklistHandler,
  ],
  exports: [WhatsAppService, SocketManager],
})
export class WhatsAppModule {}
