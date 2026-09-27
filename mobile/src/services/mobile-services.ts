import { apiClient } from './api-client';
import {
  StudentScheduleItem,
  AttendanceSubjectItem,
  FacultyClassItem,
  NoticeItem,
  PlacementDriveItem,
} from '@/types';

export const mobileStudentService = {
  /**
   * Fetch today's academic timetable slots from PostgreSQL
   */
  async getTodaySchedule(): Promise<StudentScheduleItem[]> {
    const res = await apiClient.get<StudentScheduleItem[]>('/timetable/today');
    return Array.isArray(res.data) ? res.data : [];
  },

  /**
   * Fetch student's attendance summary and subject percentages
   */
  async getAttendanceSummary(): Promise<{
    overallPercentage: number;
    statutoryThreshold: number;
    isDebarred: boolean;
    subjects: AttendanceSubjectItem[];
  }> {
    const res = await apiClient.get('/attendance/summary');
    return res.data;
  },

  /**
   * Fetch list of subject attendance with safe/critical statuses
   */
  async getSubjectAttendance(): Promise<AttendanceSubjectItem[]> {
    const res = await apiClient.get<AttendanceSubjectItem[]>('/attendance/student');
    return Array.isArray(res.data) ? res.data : [];
  },

  /**
   * Fetch student weekly schedule matrix
   */
  async getTimetable(day?: string): Promise<any[]> {
    const res = await apiClient.get('/timetable', { params: day ? { day } : {} });
    return Array.isArray(res.data) ? res.data : [];
  },

  /**
   * Fetch DigiLocker verified academic grade card
   */
  async getGradeCard(): Promise<any> {
    const res = await apiClient.get('/exams/grade-card');
    return res.data;
  },

  /**
   * Fetch published assignments
   */
  async getAssignments(): Promise<any[]> {
    const res = await apiClient.get('/assignments');
    return Array.isArray(res.data) ? res.data : [];
  },

  /**
   * Submit student assignment file
   */
  async submitAssignment(assignmentId: string, fileUrl: string): Promise<any> {
    const res = await apiClient.post(`/assignments/${assignmentId}/submit`, { fileUrl });
    return res.data;
  },

  /**
   * Real student QR attendance verification with geofencing and anti-proxy checks
   */
  async verifyQrAttendance(qrPayload: string, coords?: { lat?: number; lng?: number }) {
    const res = await apiClient.post('/attendance/verify-qr', {
      payload: qrPayload,
      userLat: coords?.lat,
      userLng: coords?.lng,
    });
    return res.data;
  },
};

export const mobileFacultyService = {
  /**
   * Fetch today's assigned teaching classes for authenticated faculty
   */
  async getTodayClasses(): Promise<FacultyClassItem[]> {
    const res = await apiClient.get<FacultyClassItem[]>('/faculty/classes/today');
    return Array.isArray(res.data) ? res.data : [];
  },

  /**
   * Fetch faculty weekly timetable
   */
  async getFacultyTimetable(day?: string): Promise<any[]> {
    const res = await apiClient.get('/timetable', { params: day ? { day } : {} });
    return Array.isArray(res.data) ? res.data : [];
  },

  /**
   * Fetch AICTE compliance workload
   */
  async getWorkload(): Promise<any> {
    const res = await apiClient.get('/faculty/me/workload');
    return res.data;
  },

  /**
   * Generate 60-second rotating QR token backed by database session
   */
  async generateClassQr(params: {
    classId: string;
    subjectCode?: string;
    section?: string;
    period?: number;
  }) {
    const res = await apiClient.post(`/faculty/classes/${params.classId}/generate-qr`, params);
    return res.data;
  },

  /**
   * Submit live attendance roster to PostgreSQL
   */
  async submitRosterAttendance(
    classId: string,
    attendanceData: { studentId: string; status: 'PRESENT' | 'ABSENT' | 'LATE' }[]
  ) {
    const res = await apiClient.post(`/faculty/classes/${classId}/attendance`, {
      records: attendanceData,
    });
    return res.data;
  },

  /**
   * Fetch real student roster for marks / attendance
   */
  async getRosterStudents(query?: { section?: string; semester?: number }): Promise<any[]> {
    const res = await apiClient.get('/students', { params: query });
    return Array.isArray(res.data) ? res.data : [];
  },

  /**
   * Submit marks to UTU node
   */
  async submitExamMarks(payload: any) {
    const res = await apiClient.post('/exams/marks/lock', payload);
    return res.data;
  },
};

export const mobileNoticeService = {
  /**
   * Fetch published official institutional circulars & notices
   */
  async getNotices(): Promise<NoticeItem[]> {
    const res = await apiClient.get<NoticeItem[]>('/notices');
    return Array.isArray(res.data) ? res.data : [];
  },
};

export const mobilePlacementService = {
  /**
   * Fetch active campus placement drives
   */
  async getDrives(): Promise<PlacementDriveItem[]> {
    const res = await apiClient.get<PlacementDriveItem[]>('/placement/drives');
    return Array.isArray(res.data) ? res.data : [];
  },

  /**
   * Apply to placement drive with eligibility validation
   */
  async applyToDrive(driveId: string): Promise<any> {
    const res = await apiClient.post(`/placement/drives/${driveId}/apply`);
    return res.data;
  },
};
