import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public isConnected = false;

  constructor() {
    let url = (process.env.DATABASE_URL || '').trim().replace(/^["']|["']$/g, '');

    // Supabase Connection Pooler on port 6543 requires ?pgbouncer=true for Prisma to disable prepared statements
    if (url.includes(':6543') && !url.includes('pgbouncer=true')) {
      url += (url.includes('?') ? '&' : '?') + 'pgbouncer=true';
    }

    super({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      datasources: {
        db: {
          url,
        },
      },
    });
  }

  async onModuleInit() {
    if (!process.env.DATABASE_URL) {
      this.logger.warn('DATABASE_URL is not set. Running in offline/mock fallback mode.');
      return;
    }

    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log(' Connected to PostgreSQL database via Prisma successfully.');
    } catch (err: any) {
      this.isConnected = false;
      this.logger.warn(
        ` Could not connect to PostgreSQL database (${err.message || 'Check DATABASE_URL'}). Services will operate in fallback mode.`
      );
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.$disconnect();
    }
  }
}

