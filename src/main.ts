import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PinoLoggerService } from './logger/logger.service';
import { ValidationPipe } from '@nestjs/common';

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

  await app.listen(process.env.PORT ?? 3000);
  logger.log(
    `Application is running on: http://localhost:${process.env.PORT ?? 3000}`,
  );
}
void bootstrap();
