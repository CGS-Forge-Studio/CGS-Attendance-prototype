import { IsOptional, IsString } from 'class-validator';

export class AttendanceQueryDto {
  @IsOptional()
  @IsString()
  date?: string; // YYYY-MM-DD
}

