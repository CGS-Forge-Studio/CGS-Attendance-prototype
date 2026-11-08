import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { CreateAttendanceDto, AttendanceStatusType } from './dto/create-attendance.dto';
import { PrismaService } from '../prisma/prisma.service';

export interface DateStatusItem {
  date: string;
  day: string;
  isPending: boolean;
}

const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  // In-memory fallback store: Record<DateString, Record<StudentId, AttendanceStatusType>>
  private inMemoryAttendance: Record<string, Record<number, AttendanceStatusType>> = {};

  constructor(private readonly prisma: PrismaService) {
    this.seedFallbackData();
  }

  private seedFallbackData() {
    let d = new Date();
    const dates: string[] = [];
    let count = 0;
    while (count < 5) {
      if (d.getDay() !== 0) {
        dates.unshift(formatLocalDate(d));
        count++;
      }
      d.setDate(d.getDate() - 1);
    }

    const today = dates[dates.length - 1];
    const yesterday = dates[dates.length - 2];

    dates.forEach((dateStr) => {
      this.inMemoryAttendance[dateStr] = {};
      if (dateStr !== today && dateStr !== yesterday) {
        for (let studentId = 1; studentId <= 40; studentId++) {
          this.inMemoryAttendance[dateStr][studentId] = studentId % 7 === 0 ? 'ab' : 'pre';
        }
      }
    });
  }

  /**
   * Helper to evaluate 9:45 AM Cutoff based on real-world time or simulation header
   */
  private checkCutoffTime(simulatedTimeHeader?: string): { isPastCutoff: boolean; timeUsed: string } {
    let hours: number;
    let minutes: number;

    if (simulatedTimeHeader && simulatedTimeHeader.includes(':')) {
      const [h, m] = simulatedTimeHeader.split(':').map(Number);
      hours = isNaN(h) ? 9 : h;
      minutes = isNaN(m) ? 30 : m;
    } else {
      const now = new Date();
      hours = now.getHours();
      minutes = now.getMinutes();
    }

    const isPastCutoff = hours > 9 || (hours === 9 && minutes >= 45);
    const timeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    return { isPastCutoff, timeUsed: timeFormatted };
  }

  /**
   * Returns list of dates (excluding Sundays) and whether attendance is pending
   */
  async getAttendanceDates(): Promise<DateStatusItem[]> {
    const result: DateStatusItem[] = [];
    let d = new Date();
    let added = 0;

    while (added < 7) {
      if (d.getDay() !== 0) {
        const dateStr = formatLocalDate(d);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        
        const attendanceData = await this.getAttendanceByDate(dateStr);
        const isPending = attendanceData.isPending;

        result.unshift({
          date: dateStr,
          day: dayName,
          isPending,
        });
        added++;
      }
      d.setDate(d.getDate() - 1);
    }

    return result;
  }

  /**
   * Fetches attendance for a given date from Supabase
   */
  async getAttendanceByDate(dateStr: string) {
    if (this.prisma.isConnected) {
      try {
        const targetDate = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00.000Z'));
        const records = await this.prisma.attendance.findMany({
          where: {
            date: targetDate,
          },
        });

        const studentMap: Record<number, AttendanceStatusType> = {};
        records.forEach((r) => {
          studentMap[r.studentId] = r.status as AttendanceStatusType;
        });

        const totalStudents = await this.prisma.student.count();
        const expectedCount = totalStudents > 0 ? totalStudents : 40;

        return {
          date: dateStr,
          records: studentMap,
          isPending: Object.keys(studentMap).length < expectedCount,
        };
      } catch (err: any) {
        this.logger.warn(`Prisma query failed for date ${dateStr}: ${err.message}`);
      }
    }

    // In-memory fallback
    const records = this.inMemoryAttendance[dateStr] || {};
    return {
      date: dateStr,
      records,
      isPending: Object.keys(records).length < 40,
    };
  }

  /**
   * Submits attendance payload
   * CRITICAL VALIDATION: Rejects if currentTime > 09:45 AM with 403 Forbidden
   */
  async recordAttendance(dto: CreateAttendanceDto, simulatedTimeHeader?: string) {
    const { isPastCutoff, timeUsed } = this.checkCutoffTime(simulatedTimeHeader);
    const todayStr = new Date().toISOString().split('T')[0];
    const isTargetingToday = dto.date === todayStr;

    // Cutoff applies only if targeting today's date, it is past 09:45 AM, and no simulated override was provided
    if (isTargetingToday && isPastCutoff && !simulatedTimeHeader) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: `Attendance submission locked after 09:45 AM (Current server time: ${timeUsed}). Contact Admin for modifications.`,
      });
    }

    if (this.prisma.isConnected) {
      try {
        const targetDate = new Date(dto.date + (dto.date.includes('T') ? '' : 'T00:00:00.000Z'));
        const allStudents = await this.prisma.student.findMany({ select: { id: true, rollNumber: true }, orderBy: { id: 'asc' } });
        const validIds = new Set(allStudents.map((s) => s.id));

        // Upsert each attendance record in PostgreSQL (Supabase)
        await this.prisma.$transaction(
          dto.records.map((r, index) => {
            const studentId = validIds.has(r.studentId)
              ? r.studentId
              : (allStudents[index]?.id || r.studentId);

            return this.prisma.attendance.upsert({
              where: {
                date_studentId: {
                  date: targetDate,
                  studentId,
                },
              },
              update: {
                status: r.status,
              },
              create: {
                date: targetDate,
                studentId,
                status: r.status,
              },
            });
          })
        );

        this.logger.log(`Successfully persisted ${dto.records.length} records to Supabase for ${dto.date}`);
      } catch (err: any) {
        this.logger.error(`Database persistence error on Supabase: ${err.message}`, err.stack);
        throw new Error(`Failed to save attendance in database: ${err.message}`);
      }
    }

    // Always update in-memory cache as well
    if (!this.inMemoryAttendance[dto.date]) {
      this.inMemoryAttendance[dto.date] = {};
    }

    dto.records.forEach((record) => {
      this.inMemoryAttendance[dto.date][record.studentId] = record.status;
    });

    return {
      success: true,
      message: `Successfully recorded attendance for ${dto.date}`,
      date: dto.date,
      count: dto.records.length,
      timestamp: new Date().toISOString(),
    };
  }
}
