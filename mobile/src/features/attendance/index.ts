import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@/lib/api/http-client';
import { queryKeys } from '@/lib/api/query-keys';
import type { AttendanceSummary, PetitionItem } from '@/types';

/** UTU Ordinance 14(B) thresholds, mirrored from backend/src/common/utils/attendance-policy.ts. */
export const ATTENDANCE_THRESHOLD = 75;
export const CONDONATION_FLOOR = 65;

export type AttendanceMark = 'PRESENT' | 'ABSENT' | 'LATE';

export interface ClassPeriod {
  subjectCode: string;
  section: string;
  period: number;
}

export const attendanceApi = {
  summary: async (): Promise<AttendanceSummary> => (await httpClient.get('/attendance/summary')).data,

  petitions: async (): Promise<PetitionItem[]> => (await httpClient.get('/attendance/petitions/me')).data,

  verifyQr: async (payload: string, coords: { lat?: number; lng?: number }): Promise<{ message: string; subject: string }> =>
    (await httpClient.post('/attendance/verify-qr', { payload, userLat: coords.lat, userLng: coords.lng })).data,

  startQrSession: async (period: ClassPeriod): Promise<{ qrCodeToken: string; expiresAt: string }> =>
    (await httpClient.post('/attendance/qr/session', period)).data,

  submitRoster: async (period: ClassPeriod, records: { studentId: string; status: AttendanceMark }[]) =>
    (await httpClient.post<{ message: string; presentCount: number }>('/attendance/batch', { ...period, records })).data,
};

export function useAttendanceSummary() {
  return useQuery({ queryKey: queryKeys.attendance.summary, queryFn: attendanceApi.summary });
}

export function useMyPetitions() {
  return useQuery({ queryKey: queryKeys.attendance.petitions, queryFn: attendanceApi.petitions });
}

/** The scanner modal shows its own result/error states, so the global alert is suppressed. */
export function useVerifyQr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, coords }: { payload: string; coords: { lat?: number; lng?: number } }) =>
      attendanceApi.verifyQr(payload, coords),
    meta: { silentError: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all }),
  });
}

export function useSubmitRoster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ period, records }: { period: ClassPeriod; records: { studentId: string; status: AttendanceMark }[] }) =>
      attendanceApi.submitRoster(period, records),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.faculty.todayClasses }),
  });
}
