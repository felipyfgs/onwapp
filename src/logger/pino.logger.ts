import pino, { Logger } from 'pino';
import { LoggerConfig } from './logger.config';

const loggerConfig = new LoggerConfig({
  get: (key: string, defaultValue?: string) => {
    return process.env[key] || defaultValue;
  },
} as any);

const options = loggerConfig.createPinoOptions();

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
