'use client';

import React from 'react';
import { Settings, RotateCcw } from 'lucide-react';
import { SimulatedTime } from '../types/attendance';

interface TimeSimulatorProps {
  simulatedTime: SimulatedTime;
  isPastCutoff: boolean;
  isSimulationActive: boolean;
  onSetTime: (time: SimulatedTime) => void;
  onResetToLive: () => void;
}

export const TimeSimulator: React.FC<TimeSimulatorProps> = ({
  simulatedTime,
  isPastCutoff,
  isSimulationActive,
  onSetTime,
  onResetToLive,
}) => {
  const formattedTime = `${String(simulatedTime.hours).padStart(2, '0')}:${String(simulatedTime.minutes).padStart(2, '0')}`;

  return (
    <div className="fixed bottom-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-purple-200 z-50 w-80 transition-all">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5 tracking-wider">
          <Settings size={15} className="text-purple-600" />
          Time Controller ({formattedTime})
        </h4>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isPastCutoff ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}
        >
          {isPastCutoff ? 'LOCKED (>09:45)' : 'OPEN (<09:45)'}
        </span>
      </div>

      <div className="flex gap-1.5 mb-2">
        <button
          onClick={onResetToLive}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
            !isSimulationActive
              ? 'bg-purple-900 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title="Use actual real-world local time"
        >
          <RotateCcw size={12} /> Live Clock
        </button>
        <button
          onClick={() => onSetTime({ hours: 9, minutes: 30 })}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
            isSimulationActive && !isPastCutoff
              ? 'bg-purple-600 text-white shadow-purple-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          09:30 AM
        </button>
        <button
          onClick={() => onSetTime({ hours: 10, minutes: 0 })}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
            isSimulationActive && isPastCutoff
              ? 'bg-red-600 text-white shadow-red-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          10:00 AM
        </button>
      </div>

      <p className="text-[11px] text-gray-500 leading-snug">
        {!isSimulationActive
          ? 'Synced to real-world clock. Click 09:30 or 10:00 to test the 09:45 AM cutoff.'
          : 'Simulation active. Click "Live Clock" to return to current real-world time.'}
      </p>
    </div>
  );
};
