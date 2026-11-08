import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';

@Controller('attendance')
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
   * GET /api/attendance/analytics/:className
   * Isolated read-only endpoint returning attendance performance & metrics
   */
  @Get('analytics/:className')
  async getAnalytics(@Param('className') className: string) {
    return this.attendanceService.getClassAnalytics(className);
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

  /**
   * DELETE /api/attendance?date=YYYY-MM-DD
   * Purges attendance records for a given date
   */
  @Delete()
  @HttpCode(HttpStatus.OK)
  async deleteAttendanceByQuery(@Query('date') dateQuery?: string) {
    if (!dateQuery) {
      throw new BadRequestException('Query parameter "date" (YYYY-MM-DD) is required.');
    }
    return this.attendanceService.deleteAttendanceForDate(dateQuery);
  }

  /**
   * DELETE /api/attendance/:date
   * Purges attendance records for a given date by route param
   */
  @Delete(':date')
  @HttpCode(HttpStatus.OK)
  async deleteAttendanceByParam(@Param('date') dateParam: string) {
    return this.attendanceService.deleteAttendanceForDate(dateParam);
  }
}
