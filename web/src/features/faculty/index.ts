import { useQuery } from "@tanstack/react-query";
import { httpClient } from "@/lib/api/http-client";
import { queryKeys } from "@/lib/api/query-keys";

/** GET /faculty, /faculty/me */
export interface FacultyMember {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  department: string;
  designation: string;
  qualification: string;
  specialization: string | null;
  /** Timetabled contact hours per week. */
  weeklyWorkloadHours: number;
  /** AICTE-required weekly hours for this member. */
  maxWorkloadHours: number;
  activePeriodsCount: number;
  assignedSubjects: { code: string; name: string; semester: number; section: string }[];
  status: "ACTIVE" | "ON_LEAVE";
}

/** GET /faculty/classes/today */
export interface TodayClass {
  id: string;
  period: number;
  time: string;
  subjectCode: string;
  subjectName: string;
  section: string;
  room: string;
  totalStudents: number;
  markedPresent: number;
  status: "UPCOMING" | "LIVE" | "COMPLETED";
}

export const facultyApi = {
  list: async (): Promise<FacultyMember[]> => (await httpClient.get("/faculty")).data,
  me: async (): Promise<FacultyMember> => (await httpClient.get("/faculty/me")).data,
  todayClasses: async (): Promise<TodayClass[]> => (await httpClient.get("/faculty/classes/today")).data,
};

export function useFacultyList() {
  return useQuery({ queryKey: queryKeys.faculty.list, queryFn: facultyApi.list });
}

export function useMyFacultyProfile() {
  return useQuery({ queryKey: queryKeys.faculty.me, queryFn: facultyApi.me });
}

export function useMyTodayClasses() {
  return useQuery({ queryKey: queryKeys.faculty.todayClasses, queryFn: facultyApi.todayClasses, refetchInterval: 60_000 });
}
