import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";
import { attendanceApi } from "./api";

export function useMySubjectAttendance() {
  return useQuery({ queryKey: queryKeys.attendance.mySubjects, queryFn: attendanceApi.mySubjects });
}

export function useMyPetitions() {
  return useQuery({ queryKey: queryKeys.attendance.myPetitions, queryFn: attendanceApi.myPetitions });
}

export function usePendingCorrections() {
  return useQuery({ queryKey: queryKeys.attendance.pendingCorrections, queryFn: attendanceApi.pendingCorrections });
}

export function useCreatePetition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: attendanceApi.createPetition,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.attendance.myPetitions }),
  });
}

/** Errors are shown inline by the scanner UI rather than as a toast. */
export function useScanQr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ token, location }: { token: string; location: { lat?: number; lng?: number } }) =>
      attendanceApi.scanQr(token, location),
    meta: { silentError: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.students.me });
    },
  });
}
