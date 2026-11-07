import { Controller, Get, Post, Body, Query, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';

@Controller('api/attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  /**
   * GET /api/attendance/dates
   * Returns last 7 working days with pending status
   */
  @Get('dates')
  async getDates() {
    return this.attendanceService.getAttendanceDates();
  }

  /**
   * GET /api/attendance?date=YYYY-MM-DD
   * Fetches attendance for a specific date
   */
  @Get()
  async getAttendance(@Query() query: AttendanceQueryDto) {
    const targetDate = query.date || new Date().toISOString().split('T')[0];
    return this.attendanceService.getAttendanceByDate(targetDate);
  }

  /**
   * POST /api/attendance
   * Submits attendance records for a date
   * Validates 09:45 AM cutoff (returns 403 if past deadline)
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async recordAttendance(
    @Body() dto: CreateAttendanceDto,
    @Headers('x-simulated-time') simulatedTime?: string
  ) {
    return this.attendanceService.recordAttendance(dto, simulatedTime);
  }
}
