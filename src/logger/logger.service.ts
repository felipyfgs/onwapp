import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import pino, { Logger as PinoLogger } from 'pino';
import pinoHttp from 'pino-http';

// Configuração do Pino
const isDev = process.env.NODE_ENV !== 'production';
const logLevel = process.env.LOG_LEVEL || (isDev ? 'debug' : 'info');
const enablePretty = process.env.LOG_PRETTY !== 'false' && isDev;

// Configuração de transporte para Pino Pretty
const transport = enablePretty
  ? pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname',
        singleLine: true,
        levelFirst: true
      }
    })
  : undefined;

// Configuração do logger principal
const pinoLogger = pino(
  {
    level: logLevel,
    base: {
      pid: false,
      hostname: false
    },
    serializers: {
      ...pino.stdSerializers,
      err: pino.stdSerializers.err
    }
  },
  transport
);

/**
 * LoggerService do NestJS que implementa LoggerService
 * Compatível com a interface padrão do NestJS
 */
@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: PinoLogger;

  constructor() {
    this.logger = pinoLogger;
  }

  /**
   * Log de informação (mapeado para info do Pino)
   */
  log(message: any, ...optionalParams: any[]): void {
    const meta = optionalParams && optionalParams.length ? ` meta=${JSON.stringify(optionalParams)}` : '';
    const msg = typeof message === 'object' ? JSON.stringify(message) : String(message);
    this.logger.info(`${msg}${meta}`);
  }

  /**
   * Log de erro (mapeado para error do Pino)
   */
  error(message: any, trace?: string, ...optionalParams: any[]): void {
    const meta = optionalParams && optionalParams.length ? ` meta=${JSON.stringify(optionalParams)}` : '';
    const msg = typeof message === 'object' ? JSON.stringify(message) : String(message);
    const tracePart = trace ? ` trace=${trace}` : '';
    this.logger.error(`${msg}${tracePart}${meta}`);
  }

  /**
   * Log de aviso (mapeado para warn do Pino)
   */
  warn(message: any, ...optionalParams: any[]): void {
    const meta = optionalParams && optionalParams.length ? ` meta=${JSON.stringify(optionalParams)}` : '';
    const msg = typeof message === 'object' ? JSON.stringify(message) : String(message);
    this.logger.warn(`${msg}${meta}`);
  }

  /**
   * Log de debug (mapeado para debug do Pino)
   */
  debug?(message: any, ...optionalParams: any[]): void {
    const meta = optionalParams && optionalParams.length ? ` meta=${JSON.stringify(optionalParams)}` : '';
    const msg = typeof message === 'object' ? JSON.stringify(message) : String(message);
    this.logger.debug(`${msg}${meta}`);
  }

  /**
   * Log verboso (mapeado para trace do Pino)
   */
  verbose?(message: any, ...optionalParams: any[]): void {
    const meta = optionalParams && optionalParams.length ? ` meta=${JSON.stringify(optionalParams)}` : '';
    const msg = typeof message === 'object' ? JSON.stringify(message) : String(message);
    this.logger.trace(`${msg}${meta}`);
  }

  /**
   * Criar child logger com contexto adicional
   */
  child(bindings: pino.Bindings): LoggerService {
    const childLogger = this.logger.child(bindings);
    const childService = new LoggerService();
    (childService as any).logger = childLogger;
    return childService;
  }

  /**
   * Métodos diretos do Pino para casos avançados
   */
  get pino(): PinoLogger {
    return this.logger;
  }

  /**
   * Verificar se um nível está habilitado
   */
  isLevelEnabled(level: string): boolean {
    return this.logger.isLevelEnabled(level);
  }

  /**
   * Log com nível específico
   */
  logLevel(level: string, message: any, ...optionalParams: any[]): void {
    const levelMethod = this.logger[level as keyof PinoLogger] as Function;
    if (levelMethod && typeof levelMethod === 'function') {
      const meta = optionalParams && optionalParams.length ? ` meta=${JSON.stringify(optionalParams)}` : '';
      const msg = typeof message === 'object' ? JSON.stringify(message) : String(message);
      levelMethod.call(this.logger, `${msg}${meta}`);
    }
  }
}

/**
 * Função para criar logger compatível com whaileys
 * Substitui a função createPinoLogger existente
 */
export function createPinoLogger(nestLogger: LoggerService | any): any {
  const pinoInstance = nestLogger instanceof LoggerService ? nestLogger.pino : nestLogger;
  
  const levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
  
  const pinoLogger: any = {
    level: pinoInstance.level,
    child: (bindings: any) => createPinoLogger(nestLogger.child ? nestLogger.child(bindings) : pinoInstance.child(bindings)),
  };

  // Mapear níveis do Pino para métodos do logger
  levels.forEach(level => {
    pinoLogger[level] = (...args: any[]) => {
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');

      switch (level) {
        case 'trace':
        case 'debug':
          if (nestLogger.debug) {
            nestLogger.debug(message);
          } else {
            pinoInstance.debug(message);
          }
          break;
        case 'info':
          if (nestLogger.log) {
            nestLogger.log(message);
          } else {
            pinoInstance.info(message);
          }
          break;
        case 'warn':
          if (nestLogger.warn) {
            nestLogger.warn(message);
          } else {
            pinoInstance.warn(message);
          }
          break;
        case 'error':
        case 'fatal':
          if (nestLogger.error) {
            nestLogger.error(message);
          } else {
            pinoInstance.error(message);
          }
          break;
      }
    };
  });

  return pinoLogger;
}

/**
 * Middleware pino-http para logs de requisição
 */
export const pinoHttpMiddleware = pinoHttp({
  logger: pinoLogger,
  genReqId: (req: any) => {
    return req.headers['x-request-id'] || 
           req.headers['x-correlation-id'] || 
           req.id || 
           Math.random().toString(36).substr(2, 9);
  },
  customProps: (req: any) => ({
    requestId: req.id,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    method: req.method,
    url: req.url
  }),
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err
  },
  // Configurações de performance
  autoLogging: {
    ignore: (req: any) => {
      // Ignorar health checks e métricas
      return req.url.includes('/health') || 
             req.url.includes('/metrics') || 
             req.url.includes('/favicon.ico');
    }
  },
  customLogLevel: (res: any, err: any) => {
    if (err || res.statusCode >= 500) {
      return 'error';
    }
    if (res.statusCode >= 400) {
      return 'warn';
    }
    if (res.statusCode >= 300) {
      return 'silent';
    }
    return 'info';
  }
});

/**
 * Instância global do logger para uso direto
 */
export const logger = pinoLogger;

/**
 * Função para criar interceptor de logging
 */
export function createLoggingInterceptor() {
  return {
    intercept(context: any, next: any) {
      const req = context.switchToHttp ? context.switchToHttp().getRequest() : context.getRequest();
      const start = Date.now();
      
      return next.handle().pipe({
        subscribe: (observer: any) => {
          const subscription = next.handle().subscribe({
            next: (data: any) => {
              const duration = Date.now() - start;
              const res = context.switchToHttp ? context.switchToHttp().getResponse() : context.getResponse();
              
              logger.info({
                method: req.method,
                url: req.url,
                statusCode: res?.statusCode,
                duration,
                requestId: req.id
              }, 'Request completed');
              
              observer.next(data);
            },
            error: (error: any) => {
              const duration = Date.now() - start;
              
              logger.error({
                method: req.method,
                url: req.url,
                duration,
                requestId: req.id,
                error: error.message
              }, 'Request failed');
              
              observer.error(error);
            },
            complete: () => {
              observer.complete();
            }
          });
          
          return () => subscription.unsubscribe();
        }
      });
    }
  };
}