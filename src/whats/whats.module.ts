import { Module } from '@nestjs/common';
import { WhatsService } from './whats.service.js';

@Module({
    providers: [WhatsService],
    exports: [WhatsService],
})
export class WhatsModule { }
