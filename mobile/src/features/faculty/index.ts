import { useMutation, useQuery } from '@tanstack/react-query';
import { httpClient } from '@/lib/api/http-client';
import { queryKeys } from '@/lib/api/query-keys';
import type { FacultyClassItem, FacultyWorkload, RosterStudent } from '@/types';

export type AssessmentType = 'INTERNAL_CIA_1' | 'INTERNAL_CIA_2' | 'PRACTICAL' | 'END_SEM';

export interface MarksSubmission {
  subjectCode: string;
  section?: string;
  assessmentType: AssessmentType;
  maxMarks: number;
  records: { studentId: string; marksObtained: number; isAbsent?: boolean }[];
}

export const facultyApi = {
  todayClasses: async (): Promise<FacultyClassItem[]> => (await httpClient.get('/faculty/classes/today')).data,
  workload: async (): Promise<FacultyWorkload> => (await httpClient.get('/faculty/me/workload')).data,
  roster: async (section?: string): Promise<RosterStudent[]> =>
    (await httpClient.get('/students', { params: section ? { section } : {} })).data,
  recordMarks: async (submission: MarksSubmission): Promise<{ savedCount: number; message: string }> =>
    (await httpClient.post('/exams/marks', submission)).data,
};

export function useTodayClasses() {
  return useQuery({ queryKey: queryKeys.faculty.todayClasses, queryFn: facultyApi.todayClasses, refetchInterval: 60_000 });
}

export function useWorkload() {
  return useQuery({ queryKey: queryKeys.faculty.workload, queryFn: facultyApi.workload });
}

export function useRoster(section: string | undefined) {
  return useQuery({
    queryKey: queryKeys.faculty.roster(section),
    queryFn: () => facultyApi.roster(section),
    enabled: Boolean(section),
  });
}

export function useRecordMarks() {
  return useMutation({ mutationFn: facultyApi.recordMarks });
}
