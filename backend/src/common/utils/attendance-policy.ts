import { AttendanceStatus } from '@prisma/client';

/**
 * UTU Ordinance 14(B) attendance rules. Every attendance/debarment calculation
 * in the backend goes through these helpers so the thresholds live in one place.
 */
export const ATTENDANCE_THRESHOLD = 75;
/** Below this, condonation is not possible. */
export const CONDONATION_FLOOR = 65;
/** At or above this, a subject is flagged EXCELLENT on dashboards. */
export const EXCELLENT_THRESHOLD = 85;

/** PRESENT and EXCUSED (approved duty/medical leave) count toward attendance; LATE and ABSENT do not. */
export function countsAsAttended(status: AttendanceStatus): boolean {
  return status === AttendanceStatus.PRESENT || status === AttendanceStatus.EXCUSED;
}

/** Percentage rounded to one decimal place. 0 when nothing has been conducted. */
export function attendancePercent(attended: number, conducted: number): number {
  if (conducted <= 0) return 0;
  return Math.round((attended / conducted) * 1000) / 10;
}

export function isBelowThreshold(percent: number): boolean {
  return percent < ATTENDANCE_THRESHOLD;
}

/** Consecutive classes a student must attend to climb back to the threshold: (a + x) / (c + x) ≥ t. */
export function classesNeededToReachThreshold(attended: number, conducted: number): number {
  const t = ATTENDANCE_THRESHOLD / 100;
  if (conducted === 0 || attended / conducted >= t) return 0;
  return Math.ceil((t * conducted - attended) / (1 - t));
}

export type SubjectStanding = 'EXCELLENT' | 'SAFE' | 'WARNING' | 'CRITICAL';

export function subjectStanding(percent: number): SubjectStanding {
  if (percent >= EXCELLENT_THRESHOLD) return 'EXCELLENT';
  if (percent >= ATTENDANCE_THRESHOLD) return 'SAFE';
  if (percent >= CONDONATION_FLOOR) return 'WARNING';
  return 'CRITICAL';
}
