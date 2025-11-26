import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { WhatsAppModule } from '../../core/whatsapp/whatsapp.module';
import { ChatwootModule } from '../../integrations/chatwoot/chatwoot.module';

@Module({
  imports: [WhatsAppModule, ChatwootModule],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}
