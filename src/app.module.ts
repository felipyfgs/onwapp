import { Module } from '@nestjs/common';
import { PinoLoggerService } from './logger/logger.service';

@Module({
  providers: [PinoLoggerService],
  exports: [PinoLoggerService],
})
export class AppModule {}
