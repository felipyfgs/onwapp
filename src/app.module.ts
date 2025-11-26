import { Module } from '@nestjs/common';
import { WhaileysModule } from './core/whaileys/whaileys.module';
import { SessionModule } from './api/session/session.module';
import { DatabaseModule } from './database/database.module';
import { LoggerModule } from './logger/logger.module';

@Module({
  imports: [WhaileysModule, SessionModule, DatabaseModule, LoggerModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
