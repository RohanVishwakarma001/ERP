import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";
import { studentsApi } from "./api";
import type { DebarmentStatus, StudentFilters } from "./types";

export function useStudents(filters: StudentFilters = {}, options: { enabled?: boolean } = {}) {
  return useQuery({ queryKey: queryKeys.students.list({ ...filters }), queryFn: () => studentsApi.list(filters), enabled: options.enabled });
}

export function useMyStudentProfile() {
  return useQuery({ queryKey: queryKeys.students.me, queryFn: studentsApi.me });
}

export function useUpdateDebarment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, status }: { studentId: string; status: DebarmentStatus }) =>
      studentsApi.updateDebarment(studentId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.executive });
    },
  });
}
