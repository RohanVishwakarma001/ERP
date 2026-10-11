import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-keys';
import { academicsApi, type PickedFile } from './api';

export { academicsApi, type PickedFile } from './api';

export function useGradeCard() {
  return useQuery({ queryKey: queryKeys.academics.gradeCard, queryFn: academicsApi.gradeCard });
}

export function useAssignments() {
  return useQuery({ queryKey: queryKeys.academics.assignments, queryFn: academicsApi.assignments });
}

export function useSubmitAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, file }: { assignmentId: string; file: PickedFile }) =>
      academicsApi.submitAssignment(assignmentId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.academics.assignments }),
  });
}
