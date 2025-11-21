import { Module } from '@nestjs/common';
import { SessionModule } from './modules/session/session.module.js';
import { MessageModule } from './modules/message/message.module.js';
import { WhatsModule } from './whats/whats.module.js';

@Module({
  imports: [SessionModule, MessageModule, WhatsModule],
})
export class AppModule { }
