'use client';

import React from 'react';
import { User } from 'lucide-react';
import { Student, Status } from '../types/attendance';

interface StudentRowProps {
  student: Student;
  status: Status;
  isPastCutoff: boolean;
  onMarkAttendance: (studentId: number, status: 'pre' | 'ab' | 'od') => void;
}

export const StudentRow: React.FC<StudentRowProps> = ({
  student,
  status,
  isPastCutoff,
  onMarkAttendance,
}) => {
  return (
    <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-purple-100 transition-colors">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 flex-shrink-0">
          <User size={20} />
        </div>
        <div className="min-w-0">
          <span className="font-semibold text-gray-800 text-sm sm:text-base truncate block">
            {student.name}
          </span>
          {student.rollNumber && (
            <span className="text-xs text-gray-400 font-mono block">#{student.rollNumber}</span>
          )}
        </div>
      </div>

      <div className="flex bg-gray-100/90 rounded-xl p-1 gap-1 flex-shrink-0">
        <button
          disabled={isPastCutoff}
          onClick={() => onMarkAttendance(student.id, 'pre')}
          className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            status === 'pre'
              ? 'bg-green-500 text-white shadow-sm'
              : 'text-gray-500 hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50 disabled:hover:bg-transparent'
          }`}
          title="Mark Present"
        >
          PRE
        </button>
        <button
          disabled={isPastCutoff}
          onClick={() => onMarkAttendance(student.id, 'ab')}
          className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            status === 'ab'
              ? 'bg-red-500 text-white shadow-sm'
              : 'text-gray-500 hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50 disabled:hover:bg-transparent'
          }`}
          title="Mark Absent"
        >
          AB
        </button>
        <button
          disabled={isPastCutoff}
          onClick={() => onMarkAttendance(student.id, 'od')}
          className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            status === 'od'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-gray-500 hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50 disabled:hover:bg-transparent'
          }`}
          title="Mark On Duty"
        >
          OD
        </button>
      </div>
    </div>
  );
};

