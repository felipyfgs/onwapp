import { Module } from '@nestjs/common';
import { WhatsService } from './whats.service';
import { SessionModule } from '../modules/session/session.module';
import { MessageModule } from '../modules/message/message.module';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [SessionModule, MessageModule, LoggerModule],
  providers: [WhatsService],
  exports: [WhatsService],
})
export class WhatsModule {}
