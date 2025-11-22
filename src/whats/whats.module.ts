import { Module } from '@nestjs/common';
import { WhatsService } from './whats.service';
import { WhatsManagerService } from './whats-manager.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LoggerModule } from '../logger/logger.module';
import { MessageModule } from '../modules/message/message.module';

@Module({
  imports: [PrismaModule, LoggerModule, MessageModule],
  providers: [WhatsService, WhatsManagerService],
  exports: [WhatsService, WhatsManagerService],
})
export class WhatsModule {}
