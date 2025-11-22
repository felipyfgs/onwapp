import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import pino, { Logger } from 'pino';

const level = process.env.LOG_LEVEL || 'info';
const transport =
  process.env.NODE_ENV === 'production'
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
          singleLine: true,
          ignore: 'pid,hostname',
        },
      };

const pinoOptions = transport ? { level, transport } : { level };
const baseLogger: Logger = pino(pinoOptions);

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: Logger = baseLogger;

  log(message: string, ...meta: unknown[]) {
    const payload =
      meta[0] && typeof meta[0] === 'object'
        ? (meta[0] as Record<string, unknown>)
        : {};
    this.logger.info(payload, message);
  }

  info(message: string, ...meta: unknown[]) {
    const payload =
      meta[0] && typeof meta[0] === 'object'
        ? (meta[0] as Record<string, unknown>)
        : {};
    this.logger.info(payload, message);
  }

  error(message: any, ...meta: unknown[]) {
    const payload =
      (meta.find((m) => m && typeof m === 'object') as
        | Record<string, unknown>
        | undefined) ?? {};
    const traceCandidate = meta.find((m) => typeof m === 'string');

    const trace =
      typeof traceCandidate === 'string' ? traceCandidate : undefined;

    if (trace) {
      payload.trace = trace;
    }

    if (message instanceof Error) {
      // Se a mensagem for um erro, passamos como primeiro argumento para o pino
      // para que ele serialize corretamente (stack trace, etc)
      this.logger.error(message, message.message);
    } else {
      this.logger.error(payload, message);
    }
  }

  warn(message: string, ...meta: unknown[]) {
    const payload =
      meta[0] && typeof meta[0] === 'object'
        ? (meta[0] as Record<string, unknown>)
        : {};
    this.logger.warn(payload, message);
  }

  debug(message: string, ...meta: unknown[]) {
    const payload =
      meta[0] && typeof meta[0] === 'object'
        ? (meta[0] as Record<string, unknown>)
        : {};
    this.logger.debug(payload, message);
  }

  verbose(message: string, ...meta: unknown[]) {
    const payload =
      meta[0] && typeof meta[0] === 'object'
        ? (meta[0] as Record<string, unknown>)
        : {};
    this.logger.trace(payload, message);
  }

  getLogger() {
    return this.logger;
  }
}
