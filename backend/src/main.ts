import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { RedactingLogger } from './common/logging/redacting-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new RedactingLogger(),
  });
  app.enableCors(); // tightened to the dashboard's real origin before pilot deployment
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}
bootstrap();
