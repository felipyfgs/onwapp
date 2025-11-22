import { Module } from '@nestjs/common';
import { LoggerModule } from './logger/logger.module';
import { SessionModule } from './modules/session/session.module';
import { MessageModule } from './modules/message/message.module';

@Module({
  imports: [LoggerModule, SessionModule, MessageModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
