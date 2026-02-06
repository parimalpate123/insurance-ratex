import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  // Enable CORS
  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('InsurRateX Rating API')
    .setDescription(
      'Configuration-driven rating engine API. Supports multiple product lines with pluggable workflows, mappings, and rules.',
    )
    .setVersion('1.0.0')
    .addTag('product-lines', 'Product line configuration management')
    .addTag('templates', 'Template library and installation')
    .addTag('execution', 'Rating execution endpoints')
    .addTag('workflows', 'Workflow management')
    .addTag('mappings', 'Data mapping management')
    .addTag('rules', 'Business rules management')
    .addTag('feature-toggles', 'Feature toggle management')
    .addTag('health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.RATING_API_PORT || 3002;
  await app.listen(port);

  logger.log(`🚀 Rating API started on http://localhost:${port}`);
  logger.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);
  logger.log(`✨ Configuration-driven rating engine ready`);
}

bootstrap();
