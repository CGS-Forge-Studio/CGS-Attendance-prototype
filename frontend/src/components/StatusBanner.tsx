'use client';

import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface StatusBannerProps {
  isPastCutoff: boolean;
  currentTimeFormatted?: string;
  isSimulated?: boolean;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  isPastCutoff,
  currentTimeFormatted,
  isSimulated,
}) => {
  return (
    <div
      className={`mb-6 p-4 rounded-2xl flex items-center justify-between gap-4 transition-colors ${
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
              ? 'The 09:45 AM deadline has passed. Contact Admin for modifications.'
              : 'Daily cutoff is 09:45 AM. Please submit attendance on time.'}
          </p>
        </div>
      </div>

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
  );
};
