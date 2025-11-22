import { Injectable, LoggerService } from '@nestjs/common';
import { LevelWithSilent } from 'pino';
import { logger } from './pino.logger';

type LogMethod = (message: any, ...optionalParams: any[]) => void;

const mapMessage = (message: any, params: unknown[]): { msg: string; meta?: unknown } => {
  if (params.length === 0) {
    return { msg: typeof message === 'string' ? message : JSON.stringify(message) };
  }

  if (typeof params[0] === 'object') {
    return {
      msg: typeof message === 'string' ? message : JSON.stringify(message),
      meta: params[0],
    };
  }

  return {
    msg: [message, ...params].map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join(' '),
  };
};

const withLevel = (level: Exclude<LevelWithSilent, 'silent'>) =>
  ((message: any, ...optionalParams: any[]) => {
    const { msg, meta } = mapMessage(message, optionalParams);
    if (meta) {
      logger[level](meta, msg);
    } else {
      logger[level](msg);
    }
  }) satisfies LogMethod;

@Injectable()
export class PinoLoggerService implements LoggerService {
  log = withLevel('info');
  error = withLevel('error');
  warn = withLevel('warn');
  debug = withLevel('debug');
  verbose = withLevel('trace');
}
