import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ClassDetailsDto {
  name: string;
  section: string;
  strength: number;
  avgAttendance: string;
  teacherName?: string;
}

export interface StudentDto {
  id: number;
  name: string;
  rollNumber: string;
}

@Injectable()
export class ClassService {
  private readonly logger = new Logger(ClassService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getClassDetails(name: string, section: string): Promise<ClassDetailsDto> {
    // If PostgreSQL database is connected via Prisma, query live data
    if (this.prisma.isConnected) {
      try {
        const found = await this.prisma.class.findFirst({
          where: {
            OR: [
              { name: { equals: `${name}-${section}`, mode: 'insensitive' } },
              { name: { equals: name, mode: 'insensitive' } },
            ],
          },
          include: {
            _count: {
              select: { students: true },
            },
          },
        });

        if (found) {
          const parts = found.name.split('-');
          return {
            name: parts[0] || found.name,
            section: found.section || parts[1] || section.toUpperCase(),
            strength: found.totalStrength || found._count.students || 40,
            avgAttendance: '92%',
            teacherName: found.teacherName || undefined,
          };
        }
      } catch (err: any) {
        this.logger.warn(`Database query failed, falling back to mock data: ${err.message}`);
      }
    }

    // Fallback
    return {
      name: name.toUpperCase(),
      section: section.toUpperCase(),
      strength: 40,
      avgAttendance: '92%',
      teacherName: 'Swarnamugi Mam',
    };
  }

  async getClassStudents(name: string, section: string): Promise<StudentDto[]> {
    if (this.prisma.isConnected) {
      try {
        const found = await this.prisma.class.findFirst({
          where: {
            OR: [
              { name: { equals: `${name}-${section}`, mode: 'insensitive' } },
              { name: { equals: name, mode: 'insensitive' } },
            ],
          },
          include: {
            students: {
              orderBy: { rollNumber: 'asc' },
            },
          },
        });

        if (found && found.students.length > 0) {
          return found.students.map((s) => ({
            id: s.id,
            name: s.name,
            rollNumber: s.rollNumber,
          }));
        }
      } catch (err: any) {
        this.logger.warn(`Database query for students failed: ${err.message}`);
      }
    }

    // Fallback: 40 placeholder students
    return Array.from({ length: 40 }, (_, i) => {
      const suffix = (i + 1).toString().padStart(2, '0');
      const roll = `11c${suffix}`;
      return {
        id: i + 1,
        name: roll,
        rollNumber: roll,
      };
    });
  }
}
