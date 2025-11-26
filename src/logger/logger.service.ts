import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import pino, { Logger } from 'pino';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: Logger;

  constructor() {
    this.logger = pino({
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
          singleLine: true,
          messageFormat: '{msg}',
        },
      },
    });
  }

  log(message: string, context?: string) {
    this.logger.info({ context: context || 'App' }, message);
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error({ context: context || 'App', trace }, message);
  }

  warn(message: string, context?: string) {
    this.logger.warn({ context: context || 'App' }, message);
  }

  debug(message: string, context?: string) {
    this.logger.debug({ context: context || 'App' }, message);
  }

  verbose(message: string, context?: string) {
    this.logger.trace({ context: context || 'App' }, message);
  }
}
