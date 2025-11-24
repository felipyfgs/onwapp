import { Injectable, LoggerService } from '@nestjs/common';
import { inspect } from 'node:util';
import { LogFn } from 'pino';
import { logger } from './pino.logger';

type LogPayload = {
  msg: string;
  meta?: Record<string, unknown>;
};

const stringify = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof Error) {
    return value.stack ?? value.message;
  }

  if (value === null || value === undefined) {
    return String(value);
  }

  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return value.toString();
  }

  try {
    return JSON.stringify(value);
  } catch {
    return inspect(value, { depth: null });
  }
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const mapPayload = (message: unknown, params: unknown[]): LogPayload => {
  if (params.length === 0) {
    return { msg: stringify(message) };
  }

  const [first, ...rest] = params;

  if (isPlainObject(first)) {
    return {
      msg: stringify(message),
      meta: first,
    };
  }

  return {
    msg: [message, first, ...rest].map(stringify).join(' '),
  };
};

const emit = (
  fn: LogFn,
  message: unknown,
  optionalParams: unknown[],
  context?: string,
): void => {
  const ignoredContexts = [
    'RoutesResolver',
    'RouterExplorer',
    'InstanceLoader',
  ];

  if (context && ignoredContexts.includes(context)) {
    return;
  }

  const { msg, meta } = mapPayload(message, optionalParams);

  const logData = context ? { ...meta, context } : meta;

  if (logData) {
    fn(logData, msg);
    return;
  }

  fn(msg);
};

@Injectable()
export class PinoLoggerService implements LoggerService {
  private context?: string;

  setContext(context: string): void {
    this.context = context;
  }

  log(message: unknown, ...optionalParams: unknown[]): void {
    const context =
      typeof optionalParams[optionalParams.length - 1] === 'string'
        ? (optionalParams.pop() as string)
        : this.context;
    emit(logger.info.bind(logger), message, optionalParams, context);
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    const context =
      typeof optionalParams[optionalParams.length - 1] === 'string'
        ? (optionalParams.pop() as string)
        : this.context;
    emit(logger.error.bind(logger), message, optionalParams, context);
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    const context =
      typeof optionalParams[optionalParams.length - 1] === 'string'
        ? (optionalParams.pop() as string)
        : this.context;
    emit(logger.warn.bind(logger), message, optionalParams, context);
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    const context =
      typeof optionalParams[optionalParams.length - 1] === 'string'
        ? (optionalParams.pop() as string)
        : this.context;
    emit(logger.debug.bind(logger), message, optionalParams, context);
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    const context =
      typeof optionalParams[optionalParams.length - 1] === 'string'
        ? (optionalParams.pop() as string)
        : this.context;
    emit(logger.trace.bind(logger), message, optionalParams, context);
  }
}
