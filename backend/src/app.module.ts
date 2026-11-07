import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ClassModule } from './class/class.module';
import { AttendanceModule } from './attendance/attendance.module';

@Module({
  imports: [PrismaModule, ClassModule, AttendanceModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
