'use client';

import React from 'react';
import { Search, Bell } from 'lucide-react';

interface DashboardHeaderProps {
  availableDates: Date[];
  selectedDateStr: string;
  onSelectDate: (dateStr: string) => void;
  isDayPending: (dateStr: string) => boolean;
  formatDate: (date: Date) => string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  availableDates,
  selectedDateStr,
  onSelectDate,
  isDayPending,
  formatDate,
}) => {
  return (
    <header className="bg-white px-6 pt-10 pb-4 rounded-b-3xl shadow-sm sticky top-0 z-20 border-b border-purple-100">
      <div className="flex justify-between items-center mb-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-white font-extrabold text-xs tracking-wider">CGS</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">11 - C Overview</h1>
            <p className="text-xs text-purple-600 font-medium">Daily Attendance Tracker</p>
          </div>
        </div>
        <div className="flex gap-2 text-gray-400">
          <button 
            aria-label="Search" 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-purple-600"
          >
            <Search size={22} />
          </button>
          <button 
            aria-label="Notifications" 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-purple-600 relative"
          >
            <Bell size={22} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-600 rounded-full"></span>
          </button>
        </div>
      </div>

      {/* Date Selector */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide max-w-2xl mx-auto">
        {availableDates.map((date) => {
          const dateStr = formatDate(date);
          const isSelected = selectedDateStr === dateStr;
          const pending = isDayPending(dateStr);

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`relative flex flex-col items-center min-w-[76px] py-3 px-3 rounded-2xl transition-all cursor-pointer select-none ${
                isSelected
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-200 scale-[1.02]'
                  : 'bg-gray-50 text-gray-500 hover:bg-purple-50 hover:text-purple-700'
              }`}
            >
              <span className={`text-[11px] font-semibold mb-1 uppercase tracking-wider ${isSelected ? 'text-purple-100' : 'text-gray-400'}`}>
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className={`text-xl font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                {date.getDate()}
              </span>

              {pending && (
                <span className="absolute top-2 right-2 flex h-2.5 w-2.5" title="Attendance pending">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};

