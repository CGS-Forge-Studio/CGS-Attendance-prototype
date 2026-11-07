export type AttendanceStatus = 'pre' | 'ab' | 'od';
export type Status = AttendanceStatus | null;

export interface Student {
  id: number;
  name: string;
  rollNumber?: string;
}

export interface ClassDetails {
  name: string;
  section: string;
  strength: number;
  avgAttendance: string;
  teacherName?: string;
}

export interface AttendanceSubmissionItem {
  studentId: number;
  status: AttendanceStatus;
}

export interface AttendanceSubmissionPayload {
  date: string;
  classId?: number;
  records: AttendanceSubmissionItem[];
}

export interface DateItem {
  date: Date;
  dateStr: string;
  weekday: string;
  dayNumber: number;
  isPending: boolean;
  isSelected: boolean;
}

export interface SimulatedTime {
  hours: number;
  minutes: number;
}

