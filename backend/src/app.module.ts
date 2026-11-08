import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ClassModule } from './class/class.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AppController } from './app.controller';

@Module({
  imports: [PrismaModule, ClassModule, AttendanceModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
