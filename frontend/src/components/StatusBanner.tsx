'use client';

import React from 'react';
import { Clock, AlertCircle, PlayCircle, CalendarOff } from 'lucide-react';

interface StatusBannerProps {
  isPastCutoff: boolean;
  isHoliday?: boolean;
  currentTimeFormatted?: string;
  isSimulated?: boolean;
  onUnlockSimulation?: () => void;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  isPastCutoff,
  isHoliday = false,
  currentTimeFormatted,
  isSimulated,
  onUnlockSimulation,
}) => {
  if (isHoliday) {
    return (
      <div className="mb-6 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 bg-amber-50 text-amber-900 border border-amber-200 transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="p-2 rounded-xl flex-shrink-0 bg-amber-100 text-amber-800">
            <CalendarOff size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-base leading-tight">School Closed / Holiday</h3>
            <p className="text-xs sm:text-sm mt-0.5 text-amber-700">
              Non-instructional day — Attendance submission is disabled for this date.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`mb-6 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 transition-colors ${
        isPastCutoff
          ? 'bg-red-50 text-red-700 border border-red-200'
          : 'bg-purple-100 text-purple-900 border border-purple-200'
      }`}
    >
      <div className="flex items-center gap-3.5">
        <div className={`p-2 rounded-xl flex-shrink-0 ${isPastCutoff ? 'bg-red-100 text-red-600' : 'bg-purple-200 text-purple-700'}`}>
          {isPastCutoff ? <AlertCircle size={24} /> : <Clock size={24} />}
        </div>
        <div>
          <h3 className="font-semibold text-base leading-tight">
            {isPastCutoff ? 'Attendance Locked' : 'Submission Open'}
          </h3>
          <p className={`text-xs sm:text-sm mt-0.5 ${isPastCutoff ? 'text-red-600' : 'text-purple-700'}`}>
            {isPastCutoff
              ? 'The 09:45 AM deadline has passed for today.'
              : 'Daily cutoff is 09:45 AM. Please submit attendance on time.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {isPastCutoff && onUnlockSimulation && (
          <button
            onClick={onUnlockSimulation}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-900 text-white hover:bg-purple-800 transition-colors shadow-sm"
            title="Set simulated time to 09:30 AM to test attendance submission"
          >
            <PlayCircle size={14} /> Test with 09:30 AM
          </button>
        )}

        {currentTimeFormatted && (
          <div className="hidden sm:flex flex-col items-end flex-shrink-0">
            <span className="text-sm font-mono font-bold tracking-tight">
              {currentTimeFormatted}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${
              isSimulated ? 'bg-amber-100 text-amber-800' : 'bg-purple-200 text-purple-800'
            }`}>
              {isSimulated ? 'Simulated' : 'Live Clock'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
