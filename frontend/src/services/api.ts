import { ClassDetails, AttendanceSubmissionPayload, Student } from '../types/attendance';

// Live production Render backend URL
const LIVE_BACKEND_URL = 'https://cgs-attendance-prototype.onrender.com';

function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  // When running on Netlify or any remote host in the browser, default to live backend
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
    return LIVE_BACKEND_URL;
  }
  return 'http://localhost:3001';
}

export const apiService = {
  /**
   * Fetch Class Details (e.g., 11-C strength and avg attendance)
   */
  async getClassDetails(className = '11', section = 'c'): Promise<ClassDetails> {
    const baseUrl = getApiBaseUrl();
    try {
      const endpoint = `${baseUrl}/api/class/${className}-${section}/details`;
      const res = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch class details`);
      return await res.json();
    } catch (err) {
      // Fallback for offline/standalone prototype testing
      return {
        name: className.toUpperCase(),
        section: section.toUpperCase(),
        strength: 40,
        avgAttendance: '92%',
        teacherName: 'Swarnamugi',
      };
    }
  },

  /**
   * Fetch Students for Class (e.g. 40 students 11c01 - 11c40)
   */
  async getClassStudents(className = '11', section = 'c'): Promise<Student[]> {
    const baseUrl = getApiBaseUrl();
    try {
      const endpoint = `${baseUrl}/api/class/${className}-${section}/students`;
      const res = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch students`);
      return await res.json();
    } catch (err) {
      // Fallback: 40 placeholder students
      return Array.from({ length: 40 }, (_, i) => {
        const suffix = (i + 1).toString().padStart(2, '0');
        const roll = `11c${suffix}`;
        return {
          id: i + 1,
          name: roll,
          rollNumber: roll,
        };
      });
    }
  },

  /**
   * Fetch attendance records for a specific date
   */
  async getAttendanceForDate(dateStr: string): Promise<Record<number, 'pre' | 'ab' | 'od'> | null> {
    const baseUrl = getApiBaseUrl();
    try {
      const endpoint = `${baseUrl}/api/attendance?date=${encodeURIComponent(dateStr)}`;
      const res = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch attendance`);
      const data = await res.json();
      return data.records || null;
    } catch (err) {
      return null;
    }
  },

  /**
   * Submit Attendance payload
   * Passes x-simulated-time header to allow backend time-simulator testing
   */
  async submitAttendance(
    payload: AttendanceSubmissionPayload,
    simulatedTime?: { hours: number; minutes: number }
  ): Promise<{ success: boolean; message: string }> {
    const baseUrl = getApiBaseUrl();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (simulatedTime) {
      headers['x-simulated-time'] = `${String(simulatedTime.hours).padStart(2, '0')}:${String(simulatedTime.minutes).padStart(2, '0')}`;
    }

    const endpoint = `${baseUrl}/api/attendance`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (res.status === 403) {
      const errorData = await res.json().catch(() => ({ message: 'Attendance submission locked after 09:45 AM.' }));
      throw new Error(errorData.message || 'Attendance Locked: Past 09:45 AM deadline.');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to submit attendance' }));
      throw new Error(err.message || 'Submission failed');
    }

    return await res.json();
  },
};
