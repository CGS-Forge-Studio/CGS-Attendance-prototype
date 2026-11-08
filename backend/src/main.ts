import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env (checks cwd, backend folder, and dist relative)
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });


async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Allowed CORS Origins: explicitly whitelist local and live Netlify domains
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || '';
  const configuredOrigins = allowedOriginsEnv
    ? allowedOriginsEnv
        .split(',')
        .map((o) => o.trim().replace(/\/+$/, ''))
        .filter(Boolean)
    : [];

  const allowedOrigins: (string | RegExp)[] = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://symphonious-tanuki-9db982.netlify.app',
    /\.netlify\.app$/,
    /\.vercel\.app$/,
    ...configuredOrigins,
  ];

  // Enable shutdown hooks for clean database disconnecting
  app.enableShutdownHooks();

  // Enable global /api route prefix
  app.setGlobalPrefix('api', { exclude: ['health'] });

  // Enable standard, robust CORS
  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-simulated-time', 'Accept', 'x-requested-with'],
  });

  // Enable DTO validation pipeline
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0'); // Bind to 0.0.0.0 for cloud hosting (Render/Railway/Docker)

  logger.log(`🚀 CGS Attendance Backend is running on port: ${port}`);
  logger.log(`🌐 Allowed CORS Origins: ${allowedOrigins.map((o) => o.toString()).join(', ')}`);
  logger.log(`📚 Class endpoint: http://localhost:${port}/api/class/11-c/details`);
  logger.log(`📅 Attendance dates endpoint: http://localhost:${port}/api/attendance/dates`);
}

bootstrap();
