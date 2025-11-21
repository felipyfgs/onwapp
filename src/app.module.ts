import { Module } from '@nestjs/common';
import { SessionModule } from './modules/session/session.module';
import { MessageModule } from './modules/message/message.module';
import { WhatsModule } from './whats/whats.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, SessionModule, MessageModule, WhatsModule],
})
export class AppModule { }
