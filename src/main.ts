import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { Reflector } from '@nestjs/core';

async function bootstrap() {
  // Use Fastify instead of Express
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Apply validation pipe globally
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // Глобальный интерцептор кэша
  const cacheManager = app.get('CACHE_MANAGER');
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new CacheInterceptor(cacheManager, reflector));

  // Set up Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('SSO Service API')
    .setDescription('The SSO Service API Documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        description: 'JWT Token',
        type: 'http',
        in: 'header',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Start the server on port 3001
  await app.listen(3001, '0.0.0.0');
  console.log(`SSO Service is running on: ${await app.getUrl()}`);
}
bootstrap();
