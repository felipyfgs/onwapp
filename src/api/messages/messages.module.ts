import { Module, forwardRef } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { WhatsAppModule } from '../../core/whatsapp/whatsapp.module';
import { ChatwootModule } from '../../integrations/chatwoot/chatwoot.module';
import { PersistenceModule } from '../../core/persistence/persistence.module';

@Module({
  imports: [
    forwardRef(() => WhatsAppModule),
    forwardRef(() => ChatwootModule),
    PersistenceModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
