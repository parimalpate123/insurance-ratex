import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS for local development
  app.enableCors();

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 Guidewire Mock Server running on http://localhost:${port}`);
  console.log(`📋 Health check: http://localhost:${port}/health`);
  console.log(`📝 Rating endpoint: http://localhost:${port}/pc/rating/submit`);
}

bootstrap();
