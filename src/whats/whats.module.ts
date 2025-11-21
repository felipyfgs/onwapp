import { Module } from '@nestjs/common';
import { WhatsService } from './whats.service';
import { WebhookModule } from '@/modules/webhook/webhook.module';

@Module({
    imports: [WebhookModule],
    providers: [WhatsService],
    exports: [WhatsService],
})
export class WhatsModule { }
