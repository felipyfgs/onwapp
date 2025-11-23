import { Module, forwardRef } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [forwardRef(() => WebhooksModule)],
  providers: [WhatsAppService],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
