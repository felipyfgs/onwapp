import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerOptions, TransportTargetOptions } from 'pino';

export type LogFormat = 'pretty' | 'json' | 'mixed';

export interface LoggerConfigOptions {
  level: string;
  format: LogFormat;
  prettyColorize: boolean;
  prettySingleLine: boolean;
  includeTimestamp: boolean;
  serviceName: string;
  structuredMetadata: boolean;
}

@Injectable()
export class LoggerConfig {
  constructor(private readonly configService: ConfigService) {}

  getOptions(): LoggerConfigOptions {
    return {
      level: this.configService.get<string>('LOG_LEVEL', 'info'),
      format:
        (this.configService.get<string>('LOG_FORMAT', 'pretty') as LogFormat) ||
        'pretty',
      prettyColorize:
        this.configService.get<string>('LOG_PRETTY_COLORIZE', 'true') ===
        'true',
      prettySingleLine:
        this.configService.get<string>('LOG_PRETTY_SINGLE_LINE', 'true') ===
        'true',
      includeTimestamp:
        this.configService.get<string>('LOG_INCLUDE_TIMESTAMP', 'true') ===
        'true',
      serviceName: this.configService.get<string>('LOG_SERVICE_NAME', 'zpwoot'),
      structuredMetadata:
        this.configService.get<string>('LOG_STRUCTURED_METADATA', 'true') ===
        'true',
    };
  }

  createPinoOptions(): LoggerOptions {
    const config = this.getOptions();

    const baseOptions: LoggerOptions = {
      level: config.level,
      base: this.createBaseOptions(config),
      formatters: this.createFormatters(),
    };

    // Configure transport based on format
    const transport = this.createTransport(config);
    if (transport) {
      baseOptions.transport = transport;
    }

    return baseOptions;
  }

  private createBaseOptions(
    config: LoggerConfigOptions,
  ): Record<string, any> | undefined {
    if (!config.structuredMetadata) {
      return undefined;
    }

    const base: Record<string, any> = {
      service: config.serviceName,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };

    if (config.includeTimestamp) {
      // Pino automatically adds timestamp, but we ensure it's included in base metadata
      base.pid = process.pid;
    }

    return base;
  }

  private createFormatters(): LoggerOptions['formatters'] {
    return {
      level: (label) => ({ level: label }),
      log: (object) => {
        // Add custom formatting logic here if needed
        return object;
      },
    };
  }

  private createTransport(
    config: LoggerConfigOptions,
  ): TransportTargetOptions | undefined {
    const nodeEnv = process.env.NODE_ENV || 'development';

    // Force JSON in production unless explicitly overridden
    const effectiveFormat =
      nodeEnv === 'production' && config.format === 'pretty'
        ? 'json'
        : config.format;

    switch (effectiveFormat) {
      case 'json':
        // Pure JSON output for production/containerized environments
        return undefined; // No transport means raw JSON

      case 'pretty':
        // Pretty console output for development
        return {
          target: 'pino-pretty',
          options: {
            colorize: config.prettyColorize,
            translateTime: config.includeTimestamp ? 'SYS:standard' : false,
            singleLine: config.prettySingleLine,
            ignore: config.structuredMetadata
              ? 'pid,hostname'
              : 'pid,hostname,service,version,environment',
            messageFormat: '{msg}',
          },
        };

      case 'mixed':
        // Mixed mode: pretty for console, JSON for files (if needed)
        return {
          target: 'pino-pretty',
          options: {
            colorize: config.prettyColorize && process.stdout.isTTY,
            translateTime: config.includeTimestamp ? 'SYS:standard' : false,
            singleLine: config.prettySingleLine,
            ignore: config.structuredMetadata
              ? 'pid,hostname'
              : 'pid,hostname,service,version,environment',
            messageFormat: '{msg}',
          },
        };

      default:
        return undefined;
    }
  }

  isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  isDevelopment(): boolean {
    return process.env.NODE_ENV !== 'production';
  }
}
