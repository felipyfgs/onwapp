import pino, { Logger, LoggerOptions } from 'pino';

const transportOptions: NonNullable<LoggerOptions['transport']> = {
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
    singleLine: true,
    ignore: 'pid,hostname',
  },
};

const options: LoggerOptions = {
  level: process.env.LOG_LEVEL ?? 'info',
  base: undefined,
  transport: transportOptions,
};

export const logger: Logger = pino(options);

export type PinoInstance = typeof logger;
