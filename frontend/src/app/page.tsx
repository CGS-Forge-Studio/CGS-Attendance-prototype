'use client';

import React, { useState, useEffect } from 'react';
import { LoginView } from '../components/LoginView';
import { DashboardHeader } from '../components/DashboardHeader';
import { StatusBanner } from '../components/StatusBanner';
import { StudentList } from '../components/StudentList';
import { Student, Status, ClassDetails, SimulatedTime } from '../types/attendance';
import { apiService } from '../services/api';
import { ArrowLeft, CheckCircle2, CheckCheck, UserX } from 'lucide-react';

const DEFAULT_STUDENTS: Student[] = Array.from({ length: 40 }, (_, i) => {
  const suffix = (i + 1).toString().padStart(2, '0');
  const roll = `11c${suffix}`;
  return {
    id: i + 1,
    name: roll,
    rollNumber: roll,
  };
});

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function AttendanceApp() {
  const [view, setView] = useState<'login' | 'dashboard'>('login');
  const [students, setStudents] = useState<Student[]>(DEFAULT_STUDENTS);
  const [classDetails, setClassDetails] = useState<ClassDetails>({
    name: '11',
    section: 'C',
    strength: 40,
    avgAttendance: '92%',
    teacherName: 'Swarnamugi',
  });

  // Real-world Time & Simulator State
  const getSystemTime = (): SimulatedTime => {
    const now = new Date();
    return { hours: now.getHours(), minutes: now.getMinutes() };
  };

  const [simulatedTime, setSimulatedTime] = useState<SimulatedTime>(getSystemTime());
  const [isSimulationActive, setIsSimulationActive] = useState<boolean>(false);

  // Sync with real-world system clock unless user explicitly tests in simulation mode
  useEffect(() => {
    if (!isSimulationActive) {
      setSimulatedTime(getSystemTime());
      const timer = setInterval(() => {
        setSimulatedTime(getSystemTime());
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [isSimulationActive]);

  // Real-world Date State
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');

  // Attendance State: Record<DateString, Record<StudentId, Status>>
  const [attendanceData, setAttendanceData] = useState<Record<string, Record<number, Status>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Initialize Real-World Dates, Class Info, and Attendance Data
  useEffect(() => {
    // 1. Fetch dynamic class details from backend
    apiService.getClassDetails('11', 'c').then((details) => {
      if (details) setClassDetails(details);
    });

    // 2. Fetch live students list from backend
    apiService.getClassStudents('11', 'c').then((fetched) => {
      if (fetched && fetched.length > 0) {
        setStudents(fetched);
      }
    });

    // 3. Initialize real-world dates: last 6 working days ending today (excluding Sundays)
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const d = new Date(today);
    let daysAdded = 0;
    while (daysAdded < 6) {
      if (d.getDay() !== 0) { // Exclude Sunday
        dates.unshift(new Date(d));
        daysAdded++;
      }
      d.setDate(d.getDate() - 1);
    }
    setAvailableDates(dates);

    // Active date is today (or the last working day if today is Sunday)
    const activeDate = today.getDay() === 0 ? dates[dates.length - 1] : today;
    const activeDateStr = formatLocalDate(activeDate);
    setSelectedDateStr(activeDateStr);

    // Initialize mock data for past days, leaving today empty/pending
    const initialData: Record<string, Record<number, Status>> = {};
    dates.forEach((date) => {
      const dateStr = formatLocalDate(date);
      initialData[dateStr] = {};
      DEFAULT_STUDENTS.forEach((s) => {
        // Pre-fill past days; leave active day pending
        if (dateStr !== activeDateStr) {
          initialData[dateStr][s.id] = Math.random() > 0.08 ? 'pre' : 'ab';
        } else {
          initialData[dateStr][s.id] = null;
        }
      });
    });
    setAttendanceData(initialData);
  }, []);

  // 9:45 AM Cutoff check
  const isPastCutoff = simulatedTime.hours > 9 || (simulatedTime.hours === 9 && simulatedTime.minutes >= 45);

  const handleMarkAttendance = (studentId: number, status: 'pre' | 'ab' | 'od') => {
    if (isPastCutoff) return; // Prevent edits if locked

    setAttendanceData((prev) => ({
      ...prev,
      [selectedDateStr]: {
        ...prev[selectedDateStr],
        [studentId]: status,
      },
    }));
  };

  // Mark all students as Leave (Absent) for the current day
  const handleMarkAllLeave = () => {
    if (isPastCutoff) return;

    setAttendanceData((prev) => {
      const updatedDay: Record<number, Status> = {};
      students.forEach((s) => {
        updatedDay[s.id] = 'ab';
      });
      return {
        ...prev,
        [selectedDateStr]: updatedDay,
      };
    });

    setNotification({
      type: 'success',
      message: `Marked all ${students.length} students as Leave for ${selectedDateStr}. Click "Submit Attendance" to save.`,
    });
  };

  // Mark all students as Present for the current day
  const handleMarkAllPresent = () => {
    if (isPastCutoff) return;

    setAttendanceData((prev) => {
      const updatedDay: Record<number, Status> = {};
      students.forEach((s) => {
        updatedDay[s.id] = 'pre';
      });
      return {
        ...prev,
        [selectedDateStr]: updatedDay,
      };
    });

    setNotification({
      type: 'success',
      message: `Marked all ${students.length} students as Present for ${selectedDateStr}.`,
    });
  };

  const isDayPending = (dateStr: string): boolean => {
    if (!attendanceData[dateStr]) return true;
    return Object.values(attendanceData[dateStr]).some((status) => status === null);
  };

  const handleSubmit = async () => {
    if (isPastCutoff || !isDayPending(selectedDateStr)) return;

    setIsSubmitting(true);
    setNotification(null);

    const currentRecords = attendanceData[selectedDateStr] || {};
    const records = Object.entries(currentRecords)
      .filter(([_, status]) => status !== null)
      .map(([studentId, status]) => ({
        studentId: Number(studentId),
        status: status as 'pre' | 'ab' | 'od',
      }));

    try {
      await apiService.submitAttendance(
        {
          date: selectedDateStr,
          records,
        },
        isSimulationActive ? simulatedTime : undefined
      );

      setNotification({
        type: 'success',
        message: `Attendance for ${selectedDateStr} saved to database successfully!`,
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Error submitting attendance.',
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  if (view === 'login') {
    return <LoginView classDetails={classDetails} onLogin={() => setView('dashboard')} />;
  }

  const currentDayPending = isDayPending(selectedDateStr);
  const currentTimeFormatted = `${String(simulatedTime.hours).padStart(2, '0')}:${String(simulatedTime.minutes).padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-[#F4F2F7] pb-12">
      {/* Top Header with Integrated Time Controller */}
      <DashboardHeader
        availableDates={availableDates}
        selectedDateStr={selectedDateStr}
        onSelectDate={setSelectedDateStr}
        isDayPending={isDayPending}
        formatDate={formatLocalDate}
        simulatedTime={simulatedTime}
        isPastCutoff={isPastCutoff}
        isSimulationActive={isSimulationActive}
        onSetTime={(time) => {
          setIsSimulationActive(true);
          setSimulatedTime(time);
        }}
        onResetToLive={() => {
          setIsSimulationActive(false);
          setSimulatedTime(getSystemTime());
        }}
      />

      {/* Main Content Area */}
      <main className="px-4 pt-6 max-w-2xl mx-auto">
        {/* Navigation / Switch Class */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setView('login')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900 transition-colors py-1 px-2.5 rounded-lg hover:bg-purple-50"
          >
            <ArrowLeft size={14} /> Back to Class Portal
          </button>
          <span className="text-xs text-gray-500 font-medium">
            Active: <strong className="text-gray-800">{selectedDateStr}</strong>
          </span>
        </div>

        {/* Toast Notification */}
        {notification && (
          <div
            className={`mb-4 p-4 rounded-2xl flex items-center gap-3 transition-all ${
              notification.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {notification.type === 'success' && <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />}
            <span className="text-sm font-semibold">{notification.message}</span>
          </div>
        )}

        {/* Status Card (Open / Cutoff Locked with Live Clock) */}
        <StatusBanner
          isPastCutoff={isPastCutoff}
          currentTimeFormatted={currentTimeFormatted}
          isSimulated={isSimulationActive}
        />

        {/* Quick Actions Toolbar */}
        <div className="mb-4 bg-white p-3.5 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-900 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
              {students.length} Students
            </span>
            <span className="text-xs text-gray-400">Class 11-C</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={isPastCutoff}
              onClick={handleMarkAllPresent}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Mark all students Present"
            >
              <CheckCheck size={14} /> All Present
            </button>
            <button
              disabled={isPastCutoff}
              onClick={handleMarkAllLeave}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              title="Mark all students Absent / Day Leave"
            >
              <UserX size={14} /> Mark Day Leave (All Leave)
            </button>
          </div>
        </div>

        {/* Student List */}
        <StudentList
          students={students}
          currentAttendance={attendanceData[selectedDateStr] || {}}
          isPastCutoff={isPastCutoff}
          onMarkAttendance={handleMarkAttendance}
        />

        {/* Submit Attendance Button */}
        <div className="mt-8">
          <button
            disabled={isPastCutoff || !currentDayPending || isSubmitting}
            onClick={handleSubmit}
            className={`w-full rounded-2xl py-4 font-semibold text-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
              isPastCutoff
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                : !currentDayPending
                ? 'bg-purple-950 text-white cursor-default'
                : 'bg-purple-900 text-white hover:bg-purple-800 active:scale-[0.99]'
            }`}
          >
            {isSubmitting
              ? 'Submitting...'
              : isPastCutoff
              ? 'Attendance Locked'
              : !currentDayPending
              ? 'All Marked (Saved)'
              : 'Submit Attendance'}
          </button>
        </div>
      </main>
    </div>
  );
}
