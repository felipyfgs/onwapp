import { Injectable } from '@nestjs/common';
import pino, { Logger } from 'pino';
import pretty from 'pino-pretty';
import type { Transform } from 'stream';
 
@Injectable()
export class LoggerService {
  private readonly logger: Logger;
 
  constructor() {
    const level = process.env.LOG_LEVEL || 'info';
 
    if (process.env.NODE_ENV === 'production') {
      this.logger = pino({ level });
      return;
    }
 
    const prettyStream: Transform = pretty({
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    }) as unknown as Transform;
 
    this.logger = pino({ level }, prettyStream);
  }
 
  log(message: string, meta?: Record<string, unknown>) {
    this.logger.info({ ...meta }, message);
  }
 
  info(message: string, meta?: Record<string, unknown>) {
    this.logger.info({ ...meta }, message);
  }
 
  warn(message: string, meta?: Record<string, unknown>) {
    this.logger.warn({ ...meta }, message);
  }
 
  error(message: string, meta?: Record<string, unknown>) {
    this.logger.error({ ...meta }, message);
  }
 
  debug(message: string, meta?: Record<string, unknown>) {
    this.logger.debug({ ...meta }, message);
  }
 
  verbose(message: string, meta?: Record<string, unknown>) {
    this.logger.trace({ ...meta }, message);
  }
 
  getLogger() {
    return this.logger;
  }
}
