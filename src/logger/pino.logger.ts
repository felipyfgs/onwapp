import pino, { Logger, LoggerOptions } from 'pino';

const transportOptions: NonNullable<LoggerOptions['transport']> = {
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'SYS:HH:MM:ss',
    singleLine: true,
    ignore: 'pid,hostname',
    messageFormat: '{msg}',
  },
};

const options: LoggerOptions = {
  level: process.env.LOG_LEVEL ?? 'info',
  base: undefined,
  transport: transportOptions,
};

export const logger: Logger = pino(options);

export type PinoInstance = typeof logger;

export function createContextLogger(context: string) {
  return {
    log: (msg: string) => logger.info({ context }, msg),
    debug: (msg: string) => logger.debug({ context }, msg),
    warn: (msg: string) => logger.warn({ context }, msg),
    error: (msg: string, error?: any) =>
      logger.error({ context, err: error }, msg),
  };
}
