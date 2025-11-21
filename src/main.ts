import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
