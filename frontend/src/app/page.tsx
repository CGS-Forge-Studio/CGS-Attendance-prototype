'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LoginView } from '../components/LoginView';
import { DashboardHeader } from '../components/DashboardHeader';
import { StatusBanner } from '../components/StatusBanner';
import { StudentList } from '../components/StudentList';
import { Student, Status, ClassDetails, SimulatedTime } from '../types/attendance';
import { apiService } from '../services/api';
import { ArrowLeft, CheckCircle2, CheckCheck, Check, CalendarOff } from 'lucide-react';

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
    teacherName: 'Swarnamugi Mam',
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
  // Track database saved state per date
  const [savedDates, setSavedDates] = useState<Record<string, boolean>>({});
  // Track dirty changes made by user
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<Record<string, boolean>>({});

  // Non-instructional Holiday / Off Day State (Zero backend schema change)
  const [holidays, setHolidays] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cgs_holidays');
        return stored ? JSON.parse(stored) : {};
      } catch {
        return {};
      }
    }
    return {};
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch live saved attendance records for a specific date from Supabase
  const loadAttendanceForDate = useCallback(async (dateStr: string) => {
    try {
      const records = await apiService.getAttendanceForDate(dateStr);
      if (records && Object.keys(records).length > 0) {
        setAttendanceData((prev) => ({
          ...prev,
          [dateStr]: {
            ...(prev[dateStr] || {}),
            ...records,
          },
        }));
        setSavedDates((prev) => ({ ...prev, [dateStr]: true }));
        setHasUnsavedChanges((prev) => ({ ...prev, [dateStr]: false }));
      } else {
        setSavedDates((prev) => ({ ...prev, [dateStr]: false }));
      }
    } catch (err) {
      console.warn(`Could not load records for ${dateStr}:`, err);
      setSavedDates((prev) => ({ ...prev, [dateStr]: false }));
    }
  }, []);

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

    // 3. Initialize dates: include today and the previous working days
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Always include today so the current day is selectable and testable
    dates.push(new Date(today));

    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    while (dates.length < 7) {
      if (d.getDay() !== 0) { // Exclude past Sundays
        dates.unshift(new Date(d));
      }
      d.setDate(d.getDate() - 1);
    }
    setAvailableDates(dates);

    // Active date defaults to today
    const activeDateStr = formatLocalDate(today);
    setSelectedDateStr(activeDateStr);

    // Initialize blank structure for all available dates
    const initialData: Record<string, Record<number, Status>> = {};
    dates.forEach((date) => {
      const dateStr = formatLocalDate(date);
      initialData[dateStr] = {};
      DEFAULT_STUDENTS.forEach((s) => {
        initialData[dateStr][s.id] = null;
      });
    });
    setAttendanceData(initialData);

    // Fetch existing attendance from Supabase for all dates
    dates.forEach((date) => {
      loadAttendanceForDate(formatLocalDate(date));
    });
  }, [loadAttendanceForDate]);

  // When selected date changes, ensure fresh records are loaded from database
  useEffect(() => {
    if (selectedDateStr) {
      loadAttendanceForDate(selectedDateStr);
    }
  }, [selectedDateStr, loadAttendanceForDate]);

  // 9:45 AM Cutoff check
  const isPastCutoff = simulatedTime.hours > 9 || (simulatedTime.hours === 9 && simulatedTime.minutes >= 45);
  const isCurrentHoliday = !!holidays[selectedDateStr];

  const handleMarkAttendance = (studentId: number, status: 'pre' | 'ab' | 'od') => {
    if (isPastCutoff || isCurrentHoliday) return; // Prevent edits if locked or holiday

    setAttendanceData((prev) => ({
      ...prev,
      [selectedDateStr]: {
        ...prev[selectedDateStr],
        [studentId]: status,
      },
    }));
    setHasUnsavedChanges((prev) => ({ ...prev, [selectedDateStr]: true }));
  };

  // Toggle "Holiday / Off Day" for the current date (Zero schema change — no Supabase submission)
  const handleToggleHoliday = () => {
    const nextState = !holidays[selectedDateStr];
    setHolidays((prev) => {
      const updated = { ...prev, [selectedDateStr]: nextState };
      try {
        localStorage.setItem('cgs_holidays', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setNotification({
      type: 'success',
      message: nextState
        ? `Marked ${selectedDateStr} as Holiday / Off Day — Attendance Not Required.`
        : `Holiday removed for ${selectedDateStr}. Regular attendance enabled.`,
    });
  };

  // Mark all students as Present for the current day
  const handleMarkAllPresent = () => {
    if (isPastCutoff || isCurrentHoliday) return;

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
    setHasUnsavedChanges((prev) => ({ ...prev, [selectedDateStr]: true }));

    setNotification({
      type: 'success',
      message: `Marked all ${students.length} students as Present for ${selectedDateStr}. Click "Submit Attendance" to save.`,
    });
  };

  // A date is pending if it has not yet been saved to Supabase (and is not an off-day / holiday)
  const isDayPending = (dateStr: string): boolean => {
    if (holidays[dateStr]) return false;
    return !savedDates[dateStr];
  };

  const handleSubmit = async () => {
    if (isCurrentHoliday || isPastCutoff || isSubmitting) return;

    const currentRecords = attendanceData[selectedDateStr] || {};
    const records = Object.entries(currentRecords)
      .filter(([_, status]) => status !== null)
      .map(([studentId, status]) => ({
        studentId: Number(studentId),
        status: status as 'pre' | 'ab' | 'od',
      }));

    if (records.length === 0) {
      setNotification({
        type: 'error',
        message: 'Please mark at least one student before submitting.',
      });
      return;
    }

    setIsSubmitting(true);
    setNotification(null);

    try {
      await apiService.submitAttendance(
        {
          date: selectedDateStr,
          records,
        },
        isSimulationActive ? simulatedTime : undefined
      );

      // Successfully saved in Supabase
      setSavedDates((prev) => ({ ...prev, [selectedDateStr]: true }));
      setHasUnsavedChanges((prev) => ({ ...prev, [selectedDateStr]: false }));

      // Re-fetch straight from Supabase to guarantee state persistence
      await loadAttendanceForDate(selectedDateStr);

      setNotification({
        type: 'success',
        message: `Attendance for ${selectedDateStr} saved to database successfully!`,
      });
    } catch (err: any) {
      console.error('[Attendance] Submit failed:', err);
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

  const isSaved = !!savedDates[selectedDateStr];
  const isDirty = !!hasUnsavedChanges[selectedDateStr];
  const canSubmit = !isCurrentHoliday && !isPastCutoff && !isSubmitting && (isDirty || !isSaved);
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

        {/* Status Card (Open / Cutoff Locked with Live Clock / Holiday) */}
        <StatusBanner
          isPastCutoff={isPastCutoff}
          isHoliday={isCurrentHoliday}
          currentTimeFormatted={currentTimeFormatted}
          isSimulated={isSimulationActive}
          onUnlockSimulation={() => {
            setIsSimulationActive(true);
            setSimulatedTime({ hours: 9, minutes: 30 });
          }}
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
              disabled={isPastCutoff || isCurrentHoliday}
              onClick={handleMarkAllPresent}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Mark all students Present"
            >
              <CheckCheck size={14} /> All Present
            </button>
            <button
              onClick={handleToggleHoliday}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all shadow-sm ${
                isCurrentHoliday
                  ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
              title={isCurrentHoliday ? 'Click to resume instructional day' : 'Mark as Holiday / Off Day'}
            >
              <CalendarOff size={14} />
              {isCurrentHoliday ? 'Holiday / Off Day (Active)' : 'Mark as Holiday / Off Day'}
            </button>
          </div>
        </div>

        {/* Student List with Holiday Overlay */}
        <div className="relative">
          {isCurrentHoliday && (
            <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-[2px] rounded-3xl flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-amber-300 shadow-sm animate-in fade-in duration-200">
              <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mb-3 shadow-inner">
                <CalendarOff size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                School Closed / Holiday
              </h3>
              <p className="text-sm font-semibold text-amber-800 max-w-sm mb-4">
                Attendance Not Required
              </p>
              <button
                onClick={handleToggleHoliday}
                className="px-4 py-2 bg-white text-gray-800 text-xs font-bold rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
              >
                Change to Instructional Day
              </button>
            </div>
          )}

          <div className={isCurrentHoliday ? 'opacity-30 pointer-events-none select-none filter blur-[0.5px]' : ''}>
            <StudentList
              students={students}
              currentAttendance={attendanceData[selectedDateStr] || {}}
              isPastCutoff={isPastCutoff || isCurrentHoliday}
              onMarkAttendance={handleMarkAttendance}
            />
          </div>
        </div>

        {/* Submit Attendance Button */}
        <div className="mt-8">
          <button
            disabled={!canSubmit}
            onClick={handleSubmit}
            className={`w-full rounded-2xl py-4 font-semibold text-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
              isCurrentHoliday
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none border border-gray-300'
                : isPastCutoff
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                : isSubmitting
                ? 'bg-purple-800 text-white cursor-wait opacity-90'
                : isSaved && !isDirty
                ? 'bg-emerald-700 text-white hover:bg-emerald-800 shadow-emerald-100'
                : 'bg-purple-900 text-white hover:bg-purple-800 active:scale-[0.99] shadow-purple-200'
            }`}
          >
            {isCurrentHoliday ? (
              <>
                <CalendarOff size={20} className="text-gray-400" />
                School Closed / Holiday — Attendance Not Required
              </>
            ) : isSubmitting ? (
              'Submitting to Supabase...'
            ) : isPastCutoff ? (
              'Attendance Locked (> 09:45 AM)'
            ) : isSaved && !isDirty ? (
              <>
                <Check size={20} className="text-white" />
                Attendance Saved in Database
              </>
            ) : (
              'Submit Attendance'
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
