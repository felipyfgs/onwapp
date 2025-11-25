import { Module, forwardRef } from '@nestjs/common';
import { ChatwootController } from './chatwoot.controller';
import { ChatwootService } from './chatwoot.service';
import { ChatwootRepository } from './chatwoot.repository';
import { ChatwootEventHandler } from './chatwoot-event.handler';
import { MessagesModule } from '../../api/messages/messages.module';
import { WhatsAppModule } from '../../core/whatsapp/whatsapp.module';
import { PersistenceModule } from '../../core/persistence/persistence.module';

@Module({
  imports: [
    forwardRef(() => MessagesModule),
    forwardRef(() => WhatsAppModule),
    PersistenceModule,
  ],
  controllers: [ChatwootController],
  providers: [ChatwootService, ChatwootRepository, ChatwootEventHandler],
  exports: [ChatwootService, ChatwootEventHandler],
})
export class ChatwootModule {}
