import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'cgs-attendance-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}

