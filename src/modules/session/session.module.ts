import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { WhatsModule } from '@/whats/whats.module';
import { WebhookModule } from '@/modules/webhook/webhook.module';

@Module({
    imports: [PrismaModule, WhatsModule, WebhookModule],
    controllers: [SessionController],
    providers: [SessionService],
    exports: [SessionService],
})
export class SessionModule { }
