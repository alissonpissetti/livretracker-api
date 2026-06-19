import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableCors({
    origin: config.get<string>('WEB_ORIGIN', '*').split(',').map((v) => v.trim()),
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  setupSwagger(app);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`LIVRE TRACKER API listening on port ${port}`);

  const docsEnabled =
    config.get<string>('API_DOCS_ENABLED', 'false').toLowerCase() === 'true';
  if (docsEnabled) {
    console.log(`Documentação Scalar: http://localhost:${port}/docs`);
  }
}

bootstrap();
