'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  TrendingUp, 
  Award, 
  CalendarCheck, 
  Users, 
  AlertCircle, 
  RefreshCw,
  BarChart2
} from 'lucide-react';
import { apiService, ClassAnalytics } from '../../services/api';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<ClassAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getClassAnalytics('11-C');
      setAnalytics(data);
    } catch (err: unknown) {
      console.error('[Analytics] Fetch error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to load attendance analytics.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatDateDisplay = (dateStr: string): string => {
    try {
      const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00.000Z'));
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getRateBadge = (rate: number) => {
    if (rate >= 90) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
          {rate}%
        </span>
      );
    }
    if (rate >= 75) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          {rate}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
        {rate}%
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F2F7] pb-16">
      {/* Header Bar */}
      <header className="bg-white px-6 pt-10 pb-6 rounded-b-3xl shadow-sm border-b border-purple-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 hover:bg-purple-50 rounded-xl transition-colors text-purple-700 hover:text-purple-900 flex items-center gap-1.5 text-sm font-semibold"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Back to Attendance</span>
            </Link>
          </div>

          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center justify-center gap-2">
              <BarChart2 size={20} className="text-purple-600" />
              Class 11-C Analytics
            </h1>
            <p className="text-xs text-purple-600 font-medium">Turnout & Performance Metrics</p>
          </div>

          <div>
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-all disabled:opacity-50"
              title="Refresh Analytics"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin text-purple-600' : ''} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-8">
        {/* Loading State: Skeletons */}
        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-pulse">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                  <div className="h-7 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-md mx-auto my-8">
            <AlertCircle size={36} className="text-red-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-red-900 mb-1">Could Not Load Analytics</h3>
            <p className="text-xs text-red-700 mb-4">{error}</p>
            <button
              onClick={fetchAnalytics}
              className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-sm"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loaded State */}
        {!loading && !error && analytics && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Average Attendance Rate */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-purple-50 flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Avg Attendance
                  </p>
                  <p className="text-2xl font-extrabold text-purple-900">
                    {analytics.avgAttendanceRate}%
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">Across all recorded sessions</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                  <TrendingUp size={20} />
                </div>
              </div>

              {/* Card 2: Highest Turnout This Month */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-purple-50 flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Monthly Peak
                  </p>
                  <p className="text-2xl font-extrabold text-emerald-700">
                    {analytics.highestThisMonth ? `${analytics.highestThisMonth.rate}%` : 'N/A'}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1 truncate max-w-[130px]">
                    {analytics.highestThisMonth 
                      ? `${analytics.highestThisMonth.presentCount} present on ${analytics.highestThisMonth.date.slice(5)}`
                      : 'No sessions this month'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Award size={20} />
                </div>
              </div>

              {/* Card 3: Total Recorded Sessions */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-purple-50 flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Recorded Sessions
                  </p>
                  <p className="text-2xl font-extrabold text-gray-900">
                    {analytics.totalSessions}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">Total attendance days</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <CalendarCheck size={20} />
                </div>
              </div>

              {/* Card 4: Class Strength */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-purple-50 flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Total Strength
                  </p>
                  <p className="text-2xl font-extrabold text-purple-700">
                    {analytics.totalStrength}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">Enrolled students</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                  <Users size={20} />
                </div>
              </div>
            </div>

            {/* Recent History Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Recent Session History</h2>
                  <p className="text-xs text-gray-500">Breakdown of recent daily turnouts</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-100">
                  {analytics.recentHistory.length} Sessions Listed
                </span>
              </div>

              {analytics.recentHistory.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <CalendarCheck size={40} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-medium">No attendance sessions recorded yet.</p>
                  <Link
                    href="/"
                    className="inline-block mt-3 text-xs text-purple-600 hover:text-purple-800 font-semibold"
                  >
                    Go to Attendance Sheet to submit attendance →
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-100">
                      <tr>
                        <th className="py-3.5 px-6 font-semibold">Date</th>
                        <th className="py-3.5 px-6 font-semibold text-center">Present</th>
                        <th className="py-3.5 px-6 font-semibold text-center">Absent</th>
                        <th className="py-3.5 px-6 font-semibold text-right">Attendance Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {analytics.recentHistory.map((session) => (
                        <tr key={session.date} className="hover:bg-purple-50/40 transition-colors">
                          <td className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
                            {formatDateDisplay(session.date)}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-md font-semibold text-xs bg-green-50 text-green-700 border border-green-200">
                              {session.presentCount}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-md font-semibold text-xs bg-red-50 text-red-700 border border-red-200">
                              {session.absentCount}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            {getRateBadge(session.rate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

