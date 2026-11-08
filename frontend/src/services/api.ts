import { ClassDetails, AttendanceSubmissionPayload, Student } from '../types/attendance';

// Default production Render backend URL fallback
const DEFAULT_RENDER_BACKEND_URL = 'https://cgs-attendance-prototype.onrender.com';

/**
 * URL Sanitization Helper:
 * Strictly uses process.env.NEXT_PUBLIC_API_URL, strips trailing slashes,
 * and formats the endpoint path to prevent double-slashes (//).
 */
export function buildApiUrl(path: string): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  // If env var is set, use it; otherwise fallback based on environment
  const rawBase = envUrl ||
    (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')
      ? DEFAULT_RENDER_BACKEND_URL
      : 'http://localhost:3001');

  // Strip trailing slashes from base
  const cleanBase = rawBase.replace(/\/+$/, '');

  // Ensure path starts with a single slash and contains no double slashes
  const cleanPath = ('/' + path.replace(/^\/+/, '')).replace(/\/+/g, '/');

  return `${cleanBase}${cleanPath}`;
}

export const apiService = {
  /**
   * Fetch Class Details (e.g., 11-C strength and avg attendance)
   */
  async getClassDetails(className = '11', section = 'c'): Promise<ClassDetails> {
    const endpoint = buildApiUrl(`/api/class/${className}-${section}/details`);
    console.log(`[API] Fetching class details from: ${endpoint}`);

    try {
      const res = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: `HTTP ${res.status}: Failed to fetch class details` }));
        console.error('[API] Backend rejected getClassDetails:', errorData);
        throw new Error(errorData.message || `HTTP ${res.status}: Failed to fetch class details`);
      }

      return await res.json();
    } catch (err: any) {
      console.error('[API] getClassDetails failed:', err);
      // Fallback for offline/standalone prototype testing
      return {
        name: className.toUpperCase(),
        section: section.toUpperCase(),
        strength: 40,
        avgAttendance: '92%',
        teacherName: 'Swarnamugi Mam',
      };
    }
  },

  /**
   * Fetch Students for Class (e.g. 40 students 11c01 - 11c40)
   */
  async getClassStudents(className = '11', section = 'c'): Promise<Student[]> {
    const endpoint = buildApiUrl(`/api/class/${className}-${section}/students`);
    console.log(`[API] Fetching students from: ${endpoint}`);

    try {
      const res = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: `HTTP ${res.status}: Failed to fetch students` }));
        console.error('[API] Backend rejected getClassStudents:', errorData);
        throw new Error(errorData.message || `HTTP ${res.status}: Failed to fetch students`);
      }

      return await res.json();
    } catch (err: any) {
      console.error('[API] getClassStudents failed:', err);
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
    const endpoint = `${buildApiUrl('/api/attendance')}?date=${encodeURIComponent(dateStr)}`;
    console.log(`[API] Fetching attendance for date: ${endpoint}`);

    try {
      const res = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: `HTTP ${res.status}: Failed to fetch attendance` }));
        console.error(`[API] Backend rejected getAttendanceForDate for ${dateStr}:`, errorData);
        throw new Error(errorData.message || `HTTP ${res.status}: Failed to fetch attendance`);
      }

      const data = await res.json();
      return data.records || null;
    } catch (err: any) {
      console.error(`[API] getAttendanceForDate failed for ${dateStr}:`, err);
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
    const endpoint = buildApiUrl('/api/attendance');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (simulatedTime) {
      headers['x-simulated-time'] = `${String(simulatedTime.hours).padStart(2, '0')}:${String(simulatedTime.minutes).padStart(2, '0')}`;
    }

    console.log(`[API] Submitting attendance to ${endpoint}:`, payload);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (res.status === 403) {
        const errorData = await res.json().catch(() => ({ message: 'Attendance submission locked after 09:45 AM.' }));
        console.warn('[API] Cutoff lock (403):', errorData);
        throw new Error(errorData.message || 'Attendance Locked: Past 09:45 AM deadline.');
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: `HTTP ${res.status}: Failed to submit attendance` }));
        console.error('[API] Backend rejected the data:', errorData);
        throw new Error(errorData.message || `Failed to save: HTTP ${res.status}`);
      }

      const data = await res.json();
      console.log('[API] Attendance successfully persisted to Supabase:', data);
      return data;
    } catch (err: any) {
      console.error('[API] Network/Fetch error during submission:', err);
      throw err;
    }
  },
};
