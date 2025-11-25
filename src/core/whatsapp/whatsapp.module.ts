import { Module, forwardRef } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { SocketManager } from './managers/socket.manager';
import { WebhooksModule } from '../../integrations/webhooks/webhooks.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { SettingsModule } from '../../api/settings/settings.module';

@Module({
  imports: [
    forwardRef(() => WebhooksModule),
    forwardRef(() => PersistenceModule),
    forwardRef(() => SettingsModule),
  ],
  providers: [WhatsAppService, SocketManager],
  exports: [WhatsAppService, SocketManager],
})
export class WhatsAppModule {}
