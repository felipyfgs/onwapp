import { Injectable } from '@nestjs/common';
import pino, { Logger } from 'pino';

@Injectable()
export class LoggerService {
  private readonly logger: Logger;

  constructor() {
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
    });
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

  getLogger() {
    return this.logger;
  }
}
