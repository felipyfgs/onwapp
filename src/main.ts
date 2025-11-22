import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerService } from './logger/logger.service';

async function bootstrap() {
  // instantiate logger before creating the app so Nest uses it from bootstrap
  const logger = new LoggerService();
  const app = await NestFactory.create(AppModule, { logger });
  app.useLogger(logger);
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
