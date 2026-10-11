/**
 * Timetable times are stored as campus-local wall-clock strings ("09:00 AM") with
 * day codes ("MON"). The server may run in UTC, so "now" is always evaluated in
 * the campus timezone rather than the process timezone.
 */
export const CAMPUS_TIMEZONE = 'Asia/Kolkata';

export const DAY_CODES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
export type DayCode = (typeof DAY_CODES)[number];

export const DAY_NAMES: Record<DayCode, string> = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
};

export type SlotStatus = 'UPCOMING' | 'LIVE' | 'COMPLETED';

interface CampusNow {
  /** null on Sunday — no classes. */
  dayCode: DayCode | null;
  minutesSinceMidnight: number;
}

export function campusNow(date = new Date()): CampusNow {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CAMPUS_TIMEZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const weekday = get('weekday').toUpperCase() as DayCode;
  return {
    dayCode: (DAY_CODES as readonly string[]).includes(weekday) ? weekday : null,
    minutesSinceMidnight: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

/** Parses "09:00 AM" / "1:30 PM" into minutes since midnight. Returns null when unparseable. */
export function parseClockTime(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(value.trim());
  if (!match) return null;
  let hours = Number(match[1]) % 12;
  if (match[3].toUpperCase() === 'PM') hours += 12;
  return hours * 60 + Number(match[2]);
}

/** Status of a slot on `dayCode` relative to the current campus time. */
export function slotStatus(dayCode: string, startTime: string, endTime: string, now = campusNow()): SlotStatus {
  const dayIndex = DAY_CODES.indexOf(dayCode as DayCode);
  const todayIndex = now.dayCode ? DAY_CODES.indexOf(now.dayCode) : DAY_CODES.length; // Sunday sorts after Saturday
  if (dayIndex < todayIndex) return 'COMPLETED';
  if (dayIndex > todayIndex) return 'UPCOMING';

  const start = parseClockTime(startTime);
  const end = parseClockTime(endTime);
  if (start == null || end == null) return 'UPCOMING';
  if (now.minutesSinceMidnight < start) return 'UPCOMING';
  if (now.minutesSinceMidnight >= end) return 'COMPLETED';
  return 'LIVE';
}
