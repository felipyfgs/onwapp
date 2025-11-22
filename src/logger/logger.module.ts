import { Module, Global } from '@nestjs/common';
import { LoggerService, createPinoLogger, pinoHttpMiddleware, logger, createLoggingInterceptor } from './logger.service';

@Global()
@Module({
  providers: [
    LoggerService,
    // Fornecer utilitários do logger como providers (useValue)
    {
      provide: 'PINO_HTTP_MIDDLEWARE',
      useValue: pinoHttpMiddleware,
    },
    {
      provide: 'CREATE_PINO_LOGGER',
      useValue: createPinoLogger,
    },
    {
      provide: 'LOGGER_INSTANCE',
      useValue: logger,
    },
    {
      provide: 'CREATE_LOGGING_INTERCEPTOR',
      useValue: createLoggingInterceptor,
    },
  ],
  exports: [
    LoggerService,
    'PINO_HTTP_MIDDLEWARE',
    'CREATE_PINO_LOGGER',
    'LOGGER_INSTANCE',
    'CREATE_LOGGING_INTERCEPTOR',
  ],
})
export class LoggerModule {}