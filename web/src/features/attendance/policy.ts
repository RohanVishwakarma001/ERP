import type { BadgeVariant } from "@/components/ui/badge";

/**
 * UTU Ordinance 14(B) thresholds, mirrored from backend/src/common/utils/attendance-policy.ts.
 * Use these helpers instead of comparing against 75 / 65 inline.
 */
export const ATTENDANCE_THRESHOLD = 75;
export const CONDONATION_FLOOR = 65;
export const EXCELLENT_THRESHOLD = 85;

export type AttendanceBand = "safe" | "condonation" | "critical";

export function attendanceBand(percent: number): AttendanceBand {
  if (percent >= ATTENDANCE_THRESHOLD) return "safe";
  if (percent >= CONDONATION_FLOOR) return "condonation";
  return "critical";
}

const BAND_TONE: Record<AttendanceBand, "success" | "warning" | "error"> = {
  safe: "success",
  condonation: "warning",
  critical: "error",
};

/** Colour tone for an attendance percentage (progress bars, badges, figures). */
export const attendanceTone = (percent: number) => BAND_TONE[attendanceBand(percent)];

export const attendanceBadgeVariant = (percent: number): BadgeVariant =>
  percent >= EXCELLENT_THRESHOLD ? "success" : percent >= ATTENDANCE_THRESHOLD ? "info" : BAND_TONE[attendanceBand(percent)];
