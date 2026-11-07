import { IsString, IsNotEmpty, IsArray, ValidateNested, IsIn, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export type AttendanceStatusType = 'pre' | 'ab' | 'od';

export class AttendanceRecordDto {
  @IsInt()
  @IsNotEmpty()
  studentId: number;

  @IsString()
  @IsIn(['pre', 'ab', 'od'], {
    message: 'status must be one of: pre (Present), ab (Absent), od (On Duty)',
  })
  status: AttendanceStatusType;
}

export class CreateAttendanceDto {
  @IsString()
  @IsNotEmpty()
  date: string; // YYYY-MM-DD

  @IsInt()
  @IsOptional()
  classId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  records: AttendanceRecordDto[];
}

