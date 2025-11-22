import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PinoLoggerService } from './logger/logger.service';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(PinoLoggerService);
  app.useLogger(logger);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Zpwoot API')
    .setDescription('API para gerenciamento de sessões WhatsApp')
    .setVersion('1.0')
    .addTag('Sessions')
    .addSecurity('apikey', {
      type: 'apiKey',
      name: 'apikey',
      in: 'header',
      description: 'API Key para autenticação',
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
  logger.log(
    `Application is running on: http://localhost:${process.env.PORT ?? 3000}`,
  );
  logger.log(
    `Swagger documentation available at: http://localhost:${process.env.PORT ?? 3000}/api/docs`,
  );
}
void bootstrap();
