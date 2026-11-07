'use client';

import React from 'react';
import { StudentRow } from './StudentRow';
import { Student, Status } from '../types/attendance';

interface StudentListProps {
  students: Student[];
  currentAttendance: Record<number, Status>;
  isPastCutoff: boolean;
  onMarkAttendance: (studentId: number, status: 'pre' | 'ab' | 'od') => void;
}

export const StudentList: React.FC<StudentListProps> = ({
  students,
  currentAttendance,
  isPastCutoff,
  onMarkAttendance,
}) => {
  return (
    <div className="space-y-3">
      {students.map((student) => (
        <StudentRow
          key={student.id}
          student={student}
          status={currentAttendance[student.id] || null}
          isPastCutoff={isPastCutoff}
          onMarkAttendance={onMarkAttendance}
        />
      ))}
    </div>
  );
};

