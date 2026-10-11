import { useQuery } from "@tanstack/react-query";
import { httpClient } from "@/lib/api/http-client";
import { queryKeys } from "@/lib/api/query-keys";

export type DayCode = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";
export const DAY_CODES: DayCode[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

/** GET /timetable, /timetable/my */
export interface TimetableSlot {
  id: string;
  dayOfWeek: DayCode;
  day: string;
  period: number;
  startTime: string;
  endTime: string;
  time: string;
  subjectCode: string;
  subjectName: string;
  facultyId: string;
  facultyName: string;
  roomNumber: string;
  section: string;
  type: "THEORY" | "LAB";
  isLab: boolean;
  status: "UPCOMING" | "LIVE" | "COMPLETED";
}

export interface TimetableFilters {
  day?: DayCode;
  section?: string;
  facultyId?: string;
}

export const timetableApi = {
  list: async (filters: TimetableFilters = {}): Promise<TimetableSlot[]> =>
    (await httpClient.get("/timetable", { params: filters })).data,
  mine: async (): Promise<TimetableSlot[]> => (await httpClient.get("/timetable/my")).data,
};

export function useTimetable(filters: TimetableFilters = {}) {
  return useQuery({ queryKey: queryKeys.timetable.list({ ...filters }), queryFn: () => timetableApi.list(filters) });
}

/** The caller's own weekly timetable (student: own section; faculty: own classes). */
export function useMyTimetable() {
  return useQuery({ queryKey: queryKeys.timetable.mine, queryFn: timetableApi.mine, refetchInterval: 60_000 });
}

/** Today's code in campus time (IST), or null on Sunday. */
export function todayDayCode(now = new Date()): DayCode | null {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", weekday: "short" }).format(now).toUpperCase();
  return (DAY_CODES as string[]).includes(weekday) ? (weekday as DayCode) : null;
}
