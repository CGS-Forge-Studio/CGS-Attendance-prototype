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

  // Parse allowed origins from environment variable
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || '';
  const configuredOrigins = allowedOriginsEnv
    ? allowedOriginsEnv
        .split(',')
        .map((o) => o.trim().replace(/\/+$/, ''))
        .filter(Boolean)
    : [];

  const defaultOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    ...configuredOrigins,
  ];

  // Enable flexible, secure CORS for multi-domain cloud deployment
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/+$/, '');

      // Check configured list or Netlify/Vercel preview subdomains
      const isConfigured = defaultOrigins.includes(normalizedOrigin) || defaultOrigins.includes(origin);
      const isNetlify = /\.netlify\.app$/.test(normalizedOrigin);
      const isVercel = /\.vercel\.app$/.test(normalizedOrigin);

      if (isConfigured || isNetlify || isVercel || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      logger.warn(`CORS blocked request from origin: ${origin}`);
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-simulated-time', 'Accept'],
  });

  // Enable DTO validation pipeline
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    })
  );

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0'); // Bind to 0.0.0.0 for cloud hosting (Render/Railway/Docker)

  logger.log(`🚀 CGS Attendance Backend is running on port: ${port}`);
  logger.log(`🌐 Allowed CORS Origins: ${defaultOrigins.join(', ')} (+ *.netlify.app, *.vercel.app)`);
  logger.log(`📚 Class endpoint: http://localhost:${port}/api/class/11-c/details`);
  logger.log(`📅 Attendance dates endpoint: http://localhost:${port}/api/attendance/dates`);
}

bootstrap();
