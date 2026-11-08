import { Controller, Get, Param } from '@nestjs/common';
import { ClassService, ClassDetailsDto, StudentDto } from './class.service';

@Controller('class')
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Get(':classId/details')
  getClassDetails(@Param('classId') classId: string): Promise<ClassDetailsDto> {
    const parts = classId.split('-');
    const className = parts[0] || '11';
    const section = parts[1] || 'C';
    return this.classService.getClassDetails(className, section);
  }

  @Get(':classId/students')
  getClassStudents(@Param('classId') classId: string): Promise<StudentDto[]> {
    const parts = classId.split('-');
    const className = parts[0] || '11';
    const section = parts[1] || 'C';
    return this.classService.getClassStudents(className, section);
  }
}
