import React, { useState, useEffect } from 'react';
import { User, Calendar as CalendarIcon, Clock, AlertCircle, LogIn, Check, Settings, X, Search, Bell } from 'lucide-react';

// --- Mock Data & Types ---
type Status = 'pre' | 'ab' | 'od' | null;

interface Student {
  id: number;
  name: string;
}

const MOCK_STUDENTS: Student[] = [
  { id: 1, name: 'Aarav Sharma' },
  { id: 2, name: 'Diya Patel' },
  { id: 3, name: 'Ethan Hunt' },
  { id: 4, name: 'Fatima Sheikh' },
  { id: 5, name: 'John Doe' },
  { id: 6, name: 'Kavya Iyer' },
  { id: 7, name: 'Leo Das' },
  { id: 8, name: 'Mia Wong' },
  { id: 9, name: 'Nikhil Verma' },
];

// Helper to format date as YYYY-MM-DD
const formatDate = (date: Date) => date.toISOString().split('T')[0];
// Helper to display friendly date format (e.g., "Mon, 28 Jun")
const formatDisplayDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' });
};

export default function AttendanceApp() {
  // --- State ---
  const [view, setView] = useState<'login' | 'dashboard'>('login');
  
  // Time Simulator State (To easily test the 9:45 AM logic)
  const [simulatedTime, setSimulatedTime] = useState({ hours: 9, minutes: 30 });
  
  // Date State
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  
  // Attendance State: Record<DateString, Record<StudentId, Status>>
  const [attendanceData, setAttendanceData] = useState<Record<string, Record<number, Status>>>({});

  // Initialize Dates (Generate past 5 days excluding Sundays)
  useEffect(() => {
    const dates: Date[] = [];
    let d = new Date(); // Assume today is the baseline
    
    // For prototype purposes, let's fix "today" to a specific Wednesday so we can simulate missing Tuesday
    d = new Date('2026-11-04T00:00:00'); // Nov 4, 2026 is a Wednesday
    
    let daysAdded = 0;
    while (daysAdded < 5) {
      if (d.getDay() !== 0) { // 0 is Sunday
        dates.unshift(new Date(d));
        daysAdded++;
      }
      d.setDate(d.getDate() - 1);
    }
    setAvailableDates(dates);
    
    const todayStr = formatDate(dates[dates.length - 1]);
    const yesterdayStr = formatDate(dates[dates.length - 2]);

    setSelectedDateStr(todayStr);

    // Mock initial data: Missing yesterday (Tuesday), Today is blank
    const initialData: Record<string, Record<number, Status>> = {};
    dates.forEach(date => {
      const dateStr = formatDate(date);
      initialData[dateStr] = {};
      MOCK_STUDENTS.forEach(s => {
        // Pre-fill older days, leave Yesterday and Today empty to simulate missing
        if (dateStr !== todayStr && dateStr !== yesterdayStr) {
          initialData[dateStr][s.id] = Math.random() > 0.1 ? 'pre' : 'ab';
        } else {
          initialData[dateStr][s.id] = null;
        }
      });
    });
    setAttendanceData(initialData);
  }, []);

  // --- Logic ---
  const isPastCutoff = simulatedTime.hours > 9 || (simulatedTime.hours === 9 && simulatedTime.minutes >= 45);

  const handleMarkAttendance = (studentId: number, status: Status) => {
    if (isPastCutoff) return; // Prevent edits if locked
    
    setAttendanceData(prev => ({
      ...prev,
      [selectedDateStr]: {
        ...prev[selectedDateStr],
        [studentId]: status
      }
    }));
  };

  const isDayPending = (dateStr: string) => {
    if (!attendanceData[dateStr]) return true;
    return Object.values(attendanceData[dateStr]).some(status => status === null);
  };

  // --- UI Components ---

  const LoginView = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-purple-100">
        <div className="bg-purple-600 p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <User size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-wide">CGS ATTENDANCE</h1>
          <p className="text-purple-200 mt-2">Teacher Portal</p>
        </div>
        
        <div className="p-8">
          <div className="bg-purple-50 rounded-2xl p-6 mb-8 border border-purple-100">
            <h2 className="text-4xl font-bold text-center text-purple-900 mb-6">11 - C</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Strength</p>
                <p className="text-2xl font-bold text-purple-700">{MOCK_STUDENTS.length}</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Avg. Present</p>
                <p className="text-2xl font-bold text-purple-700">92%</p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setView('dashboard')}
            className="w-full bg-purple-900 text-white rounded-2xl py-4 font-semibold text-lg hover:bg-purple-800 transition-colors flex items-center justify-center gap-2"
          >
            <LogIn size={20} />
            Login to Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  const DashboardView = () => (
    <div className="min-h-screen bg-[#F4F2F7] pb-24">
      {/* Header (Tennis App Style) */}
      <header className="bg-white px-6 pt-12 pb-4 rounded-b-3xl shadow-sm sticky top-0 z-10 border-b border-purple-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">CGS</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">11 - C Overview</h1>
          </div>
          <div className="flex gap-3 text-gray-400">
            <Search size={24} />
            <Bell size={24} />
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {availableDates.map((date) => {
            const dateStr = formatDate(date);
            const isSelected = selectedDateStr === dateStr;
            const pending = isDayPending(dateStr);
            
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDateStr(dateStr)}
                className={`relative flex flex-col items-center min-w-[80px] py-3 px-4 rounded-2xl transition-all ${
                  isSelected 
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-200' 
                    : 'bg-gray-50 text-gray-500 hover:bg-purple-50'
                }`}
              >
                <span className="text-xs font-medium mb-1 uppercase tracking-wider">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                  {date.getDate()}
                </span>
                
                {pending && (
                  <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="px-4 pt-6 max-w-2xl mx-auto">
        
        {/* Status Card */}
        <div className={`mb-6 p-4 rounded-2xl flex items-center gap-4 ${isPastCutoff ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-purple-100 text-purple-800 border border-purple-200'}`}>
          {isPastCutoff ? <AlertCircle size={24} /> : <Clock size={24} />}
          <div>
            <h3 className="font-semibold">{isPastCutoff ? 'Attendance Locked' : 'Submission Open'}</h3>
            <p className="text-sm opacity-80">
              {isPastCutoff 
                ? 'The 9:45 AM deadline has passed. Contact Admin for modifications.' 
                : 'Please complete attendance before 9:45 AM.'}
            </p>
          </div>
        </div>

        {/* Student List */}
        <div className="space-y-3">
          {MOCK_STUDENTS.map((student) => {
            const status = attendanceData[selectedDateStr]?.[student.id] || null;
            
            return (
              <div key={student.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                    <User size={20} />
                  </div>
                  <span className="font-medium text-gray-800">{student.name}</span>
                </div>
                
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                  <button
                    disabled={isPastCutoff}
                    onClick={() => handleMarkAttendance(student.id, 'pre')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      status === 'pre' ? 'bg-green-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-transparent'
                    }`}
                  >
                    PRE
                  </button>
                  <button
                    disabled={isPastCutoff}
                    onClick={() => handleMarkAttendance(student.id, 'ab')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      status === 'ab' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-transparent'
                    }`}
                  >
                    AB
                  </button>
                  <button
                    disabled={isPastCutoff}
                    onClick={() => handleMarkAttendance(student.id, 'od')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      status === 'od' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-transparent'
                    }`}
                  >
                    OD
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit Button */}
        <div className="mt-8">
          <button 
            disabled={isPastCutoff || !isDayPending(selectedDateStr)}
            className="w-full bg-gray-900 text-white rounded-2xl py-4 font-semibold text-lg hover:bg-black transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg"
          >
            {isPastCutoff ? 'Locked' : isDayPending(selectedDateStr) ? 'Submit Attendance' : 'Saved'}
          </button>
        </div>
      </div>

      {/* --- Developer Tools (Time Simulator) --- */}
      <div className="fixed bottom-4 right-4 bg-white p-4 rounded-2xl shadow-xl border border-purple-200 z-50 w-64">
        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1"><Settings size={14}/> Dev: Simulate Time</h4>
        <div className="flex gap-2 mb-2">
          <button onClick={() => setSimulatedTime({ hours: 9, minutes: 30 })} className={`flex-1 py-2 rounded-lg text-xs font-bold ${!isPastCutoff ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            09:30 AM
          </button>
          <button onClick={() => setSimulatedTime({ hours: 10, minutes: 0 })} className={`flex-1 py-2 rounded-lg text-xs font-bold ${isPastCutoff ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            10:00 AM
          </button>
        </div>
        <p className="text-[10px] text-gray-400 leading-tight">Switch to 10:00 AM to test the 9:45 AM read-only lock feature across all dates.</p>
      </div>
    </div>
  );

  return view === 'login' ? <LoginView /> : <DashboardView />;
}