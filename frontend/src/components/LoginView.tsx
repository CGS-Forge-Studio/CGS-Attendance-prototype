'use client';

import React from 'react';
import { User, LogIn } from 'lucide-react';
import { ClassDetails } from '../types/attendance';

interface LoginViewProps {
  classDetails: ClassDetails;
  onLogin: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ classDetails, onLogin }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-purple-100 transition-all">
        {/* Card Header */}
        <div className="bg-purple-600 p-8 text-center text-white relative">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm shadow-inner">
            <User size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-wide">CGS ATTENDANCE</h1>
          <p className="text-purple-200 mt-2 font-medium">
            {classDetails.teacherName ? `Teacher: ${classDetails.teacherName}` : 'Teacher Portal'}
          </p>
        </div>

        {/* Card Body */}
        <div className="p-8">
          <div className="bg-purple-50 rounded-2xl p-6 mb-8 border border-purple-100">
            <h2 className="text-4xl font-bold text-center text-purple-900 mb-6 tracking-tight">
              {classDetails.name} - {classDetails.section}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-purple-50">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1 tracking-wider">Strength</p>
                <p className="text-2xl font-bold text-purple-700">{classDetails.strength}</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-purple-50">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1 tracking-wider">Avg. Present</p>
                <p className="text-2xl font-bold text-purple-700">{classDetails.avgAttendance}</p>
              </div>
            </div>
          </div>

          <button
            onClick={onLogin}
            className="w-full bg-purple-900 text-white rounded-2xl py-4 font-semibold text-lg hover:bg-purple-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <LogIn size={20} />
            Login to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

