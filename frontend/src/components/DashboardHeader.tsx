'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Search, Bell, BarChart3, Clock, RotateCcw, X } from 'lucide-react';
import { SimulatedTime } from '../types/attendance';

interface DashboardHeaderProps {
  availableDates: Date[];
  selectedDateStr: string;
  onSelectDate: (dateStr: string) => void;
  isDayPending: (dateStr: string) => boolean;
  formatDate: (date: Date) => string;
  // Time Control Props
  simulatedTime?: SimulatedTime;
  isPastCutoff?: boolean;
  isSimulationActive?: boolean;
  onSetTime?: (time: SimulatedTime) => void;
  onResetToLive?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  availableDates,
  selectedDateStr,
  onSelectDate,
  isDayPending,
  formatDate,
  simulatedTime = { hours: 9, minutes: 30 },
  isPastCutoff = false,
  isSimulationActive = false,
  onSetTime,
  onResetToLive,
}) => {
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTimeDropdownOpen(false);
      }
    };

    if (isTimeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTimeDropdownOpen]);

  const formattedTime = `${String(simulatedTime.hours).padStart(2, '0')}:${String(simulatedTime.minutes).padStart(2, '0')}`;

  return (
    <header className="bg-white px-6 pt-10 pb-4 rounded-b-3xl shadow-sm sticky top-0 z-30 border-b border-purple-100">
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

        {/* Action Buttons: Search, Notifications, & Time Controller */}
        <div className="flex items-center gap-1.5 text-gray-400 relative" ref={dropdownRef}>
          <button 
            aria-label="Search" 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-purple-600"
          >
            <Search size={21} />
          </button>

          <button 
            aria-label="Notifications" 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-purple-600 relative"
          >
            <Bell size={21} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-600 rounded-full"></span>
          </button>

          {/* Performance & Analytics Link */}
          <Link
            href="/analytics"
            aria-label="Attendance Analytics"
            className="p-2 hover:bg-purple-50 rounded-full transition-colors text-gray-500 hover:text-purple-700 relative"
            title="Attendance Performance & Analytics"
          >
            <BarChart3 size={21} />
          </Link>

          {/* Time Controller Button */}
          <button
            onClick={() => setIsTimeDropdownOpen((prev) => !prev)}
            aria-label="Time Controller"
            className={`p-2 rounded-full transition-all relative ${
              isTimeDropdownOpen
                ? 'bg-purple-100 text-purple-700'
                : 'hover:bg-gray-100 text-gray-500 hover:text-purple-600'
            }`}
            title={`Time: ${formattedTime} (${isPastCutoff ? 'Locked' : 'Open'})`}
          >
            <Clock size={21} />
            {/* Status Indicator Dot */}
            <span
              className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-white ${
                isSimulationActive
                  ? 'bg-amber-500'
                  : isPastCutoff
                  ? 'bg-red-500'
                  : 'bg-green-500'
              }`}
            ></span>
          </button>

          {/* Time Controller Popover Dropdown */}
          {isTimeDropdownOpen && (
            <div className="absolute right-0 top-12 z-50 w-72 bg-white rounded-2xl shadow-xl border border-purple-100 p-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <Clock size={16} className="text-purple-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-700">Time Control</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isPastCutoff ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {isPastCutoff ? 'LOCKED (>09:45)' : 'OPEN (<09:45)'}
                  </span>
                  <button
                    onClick={() => setIsTimeDropdownOpen(false)}
                    className="text-gray-400 hover:text-gray-600 p-0.5"
                    aria-label="Close"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Current Active Time Display */}
              <div className="bg-purple-50 p-2.5 rounded-xl mb-3 flex items-center justify-between border border-purple-100">
                <span className="text-xs text-gray-500 font-medium">Active Time:</span>
                <span className="text-sm font-mono font-bold text-purple-900">{formattedTime}</span>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-1.5 mb-2.5">
                <button
                  onClick={() => {
                    onResetToLive?.();
                  }}
                  className={`flex-1 py-2 px-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    !isSimulationActive
                      ? 'bg-purple-900 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Use real-world clock"
                >
                  <RotateCcw size={11} /> Live
                </button>
                <button
                  onClick={() => {
                    onSetTime?.({ hours: 9, minutes: 30 });
                  }}
                  className={`flex-1 py-2 px-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                    isSimulationActive && !isPastCutoff
                      ? 'bg-purple-600 text-white shadow-purple-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Simulate 9:30 AM (Open)"
                >
                  09:30 AM
                </button>
                <button
                  onClick={() => {
                    onSetTime?.({ hours: 10, minutes: 0 });
                  }}
                  className={`flex-1 py-2 px-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                    isSimulationActive && isPastCutoff
                      ? 'bg-red-600 text-white shadow-red-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Simulate 10:00 AM (Locked)"
                >
                  10:00 AM
                </button>
              </div>

              <p className="text-[10px] text-gray-400 leading-tight">
                {!isSimulationActive
                  ? 'Currently synced with live clock. Switch to 10:00 AM to test the 09:45 AM deadline lock.'
                  : 'Simulation active. Click "Live" to revert to real-world clock.'}
              </p>
            </div>
          )}
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
