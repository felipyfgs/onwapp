import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { ApiKeyGuard } from './common/guards/api-key.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalGuards(new ApiKeyGuard());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
