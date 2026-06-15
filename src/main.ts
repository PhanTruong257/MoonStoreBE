import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';
import { UPLOAD_ROOT_DIR, UPLOAD_STATIC_PREFIX } from './modules/uploads/uploads.constants';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: corsOrigin.split(',').map((origin) => origin.trim()),
    credentials: true,
  });
  app.useWebSocketAdapter(new IoAdapter(app));

  if (!existsSync(UPLOAD_ROOT_DIR)) {
    mkdirSync(UPLOAD_ROOT_DIR, { recursive: true });
  }
  app.useStaticAssets(UPLOAD_ROOT_DIR, { prefix: UPLOAD_STATIC_PREFIX });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Moon Store API')
    .setDescription('API documentation for Moon Store')
    .setVersion('1.0')
    .addCookieAuth('access_token', {
      type: 'apiKey',
      in: 'cookie',
    })
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
