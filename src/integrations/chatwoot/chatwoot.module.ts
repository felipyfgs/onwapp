import { Module } from '@nestjs/common';
import { ChatwootController } from './chatwoot.controller';
import { ChatwootService } from './chatwoot.service';
import { ChatwootRepository } from './chatwoot.repository';

@Module({
  controllers: [ChatwootController],
  providers: [ChatwootService, ChatwootRepository],
  exports: [ChatwootService],
})
export class ChatwootModule {}
