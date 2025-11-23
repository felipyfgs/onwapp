import { Module, forwardRef } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    forwardRef(() => WebhooksModule),
    forwardRef(() => PersistenceModule),
    forwardRef(() => SettingsModule),
  ],
  providers: [WhatsAppService],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
