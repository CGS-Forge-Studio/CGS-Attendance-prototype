import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { CreateAttendanceDto, AttendanceStatusType } from './dto/create-attendance.dto';
import { PrismaService } from '../prisma/prisma.service';

export interface DateStatusItem {
  date: string;
  day: string;
  isPending: boolean;
}

export interface SessionSummary {
  date: string;
  presentCount: number;
  absentCount: number;
  rate: number;
}

export interface ClassAnalyticsDto {
  totalStrength: number;
  totalSessions: number;
  avgAttendanceRate: number;
  highestThisMonth: SessionSummary | null;
  recentHistory: SessionSummary[];
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
    const today = new Date();
    const todayStr = formatLocalDate(today);
    const todayAttendance = await this.getAttendanceByDate(todayStr);
    result.push({
      date: todayStr,
      day: today.toLocaleDateString('en-US', { weekday: 'short' }),
      isPending: todayAttendance.isPending,
    });

    let d = new Date(today);
    d.setDate(d.getDate() - 1);
    while (result.length < 7) {
      if (d.getDay() !== 0) {
        const dateStr = formatLocalDate(d);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        
        const attendanceData = await this.getAttendanceByDate(dateStr);
        result.unshift({
          date: dateStr,
          day: dayName,
          isPending: attendanceData.isPending,
        });
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

    if (isPastCutoff) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: `Attendance submission locked after 09:45 AM (Current server/simulated time: ${timeUsed}). Contact Admin for modifications.`,
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

  /**
   * Computes read-only analytics statistics for a class
   * Rule 1: Strict read-only. Zero schema changes or write operations.
   */
  async getClassAnalytics(className: string): Promise<ClassAnalyticsDto> {
    const rawName = className || '11-C';
    const normalizedClassName = rawName.toUpperCase();

    let totalStrength = 40;
    let studentIds: number[] = [];

    if (this.prisma.isConnected) {
      try {
        const classRecord = await this.prisma.class.findFirst({
          where: {
            OR: [
              { name: { equals: normalizedClassName, mode: 'insensitive' } },
              { name: { equals: normalizedClassName.replace('-', ' '), mode: 'insensitive' } },
              { name: { contains: normalizedClassName.split('-')[0] || '11', mode: 'insensitive' } },
            ],
          },
          include: {
            students: {
              select: { id: true },
            },
          },
        });

        if (classRecord) {
          totalStrength = classRecord.totalStrength || classRecord.students.length || 40;
          studentIds = classRecord.students.map((s) => s.id);
        } else {
          const studentCount = await this.prisma.student.count();
          if (studentCount > 0) totalStrength = studentCount;
        }

        const whereClause = studentIds.length > 0 ? { studentId: { in: studentIds } } : {};
        const records = await this.prisma.attendance.findMany({
          where: whereClause,
          orderBy: { date: 'desc' },
          select: {
            date: true,
            status: true,
            studentId: true,
          },
        });

        if (records.length > 0) {
          return this.aggregateSessionRecords(records, totalStrength);
        }
      } catch (err: any) {
        this.logger.warn(`Prisma analytics query failed: ${err.message}. Falling back to in-memory.`);
      }
    }

    return this.calculateInMemoryAnalytics(totalStrength);
  }

  private aggregateSessionRecords(
    records: Array<{ date: Date; status: string; studentId: number }>,
    totalStrength: number
  ): ClassAnalyticsDto {
    const sessionMap = new Map<string, { presentCount: number; absentCount: number; odCount: number }>();

    for (const r of records) {
      const dateStr = formatLocalDate(new Date(r.date));
      if (!sessionMap.has(dateStr)) {
        sessionMap.set(dateStr, { presentCount: 0, absentCount: 0, odCount: 0 });
      }
      const item = sessionMap.get(dateStr)!;
      if (r.status === 'pre') {
        item.presentCount++;
      } else if (r.status === 'ab') {
        item.absentCount++;
      } else if (r.status === 'od') {
        item.odCount++;
      }
    }

    const sessions: SessionSummary[] = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    for (const [dateStr, counts] of sessionMap.entries()) {
      const totalMarked = counts.presentCount + counts.absentCount + counts.odCount;
      const effectiveTotal = totalMarked > 0 ? totalMarked : totalStrength;
      const attended = counts.presentCount + counts.odCount;
      const rate = effectiveTotal > 0 ? Number(((attended / effectiveTotal) * 100).toFixed(1)) : 0;

      sessions.push({
        date: dateStr,
        presentCount: counts.presentCount,
        absentCount: counts.absentCount,
        rate,
      });
    }

    sessions.sort((a, b) => b.date.localeCompare(a.date));

    const totalSessions = sessions.length;
    const avgAttendanceRate = totalSessions > 0
      ? Number((sessions.reduce((sum, s) => sum + s.rate, 0) / totalSessions).toFixed(1))
      : 0;

    const thisMonthSessions = sessions.filter((s) => {
      const d = new Date(s.date + 'T00:00:00.000Z');
      return d.getUTCFullYear() === currentYear && d.getUTCMonth() === currentMonth;
    });

    let highestThisMonth: SessionSummary | null = null;
    if (thisMonthSessions.length > 0) {
      highestThisMonth = thisMonthSessions.reduce((max, curr) => (curr.rate > max.rate ? curr : max), thisMonthSessions[0]);
    }

    return {
      totalStrength,
      totalSessions,
      avgAttendanceRate,
      highestThisMonth,
      recentHistory: sessions.slice(0, 15),
    };
  }

  private calculateInMemoryAnalytics(totalStrength: number): ClassAnalyticsDto {
    const records: Array<{ date: Date; status: string; studentId: number }> = [];

    for (const [dateStr, dayRecords] of Object.entries(this.inMemoryAttendance)) {
      const d = new Date(dateStr + 'T00:00:00.000Z');
      for (const [studentIdStr, status] of Object.entries(dayRecords)) {
        if (status) {
          records.push({
            date: d,
            status,
            studentId: Number(studentIdStr),
          });
        }
      }
    }

    if (records.length > 0) {
      return this.aggregateSessionRecords(records, totalStrength);
    }

    return {
      totalStrength,
      totalSessions: 0,
      avgAttendanceRate: 0,
      highestThisMonth: null,
      recentHistory: [],
    };
  }
}
