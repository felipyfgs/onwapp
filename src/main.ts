import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoggerService, pinoHttpMiddleware } from './logger/logger.service';

async function bootstrap() {
  // Criar app sem logger padrão do NestJS
  const app = await NestFactory.create(AppModule, { 
    logger: false 
  });

  // Configurar LoggerService como logger global
  const loggerService = app.get(LoggerService);
  app.useLogger(loggerService);

  // Adicionar middleware pino-http para logs de requisição
  app.use(pinoHttpMiddleware);

  const config = new DocumentBuilder()
    .setTitle('zpwoot API')
    .setDescription('WhatsApp API Service based on whaileys')
    .setVersion('1.0')
    .addApiKey({
      type: 'apiKey',
      in: 'header',
      name: 'apikey',
      description: 'API Key for authentication. Add your API key in \'apikey\' header.'
    }, 'apikey')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  
  // Adicionar segurança global a todos os endpoints
  document.paths = Object.keys(document.paths).reduce((acc, path) => {
    const pathItem = document.paths[path];
    Object.keys(pathItem).forEach(method => {
      if (pathItem[method].security) {
        pathItem[method].security = [{ apikey: [] }];
      }
    });
    acc[path] = pathItem;
    return acc;
  }, {});
  
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  
  // Log de inicialização usando o novo logger
  loggerService.log(`🚀 Application started on port ${port}`);
  loggerService.log(`📚 Swagger documentation available at http://localhost:${port}/api`);
}
bootstrap();