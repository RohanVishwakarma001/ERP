import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/lib/api/http-client";
import { queryKeys } from "@/lib/api/query-keys";

export type SubmissionStatus = "SUBMITTED" | "EVALUATED" | "RESUBMITTED" | "LATE";

/** GET /assignments */
export interface Assignment {
  id: string;
  subjectId: string;
  sectionId: string;
  subjectCode: string;
  subjectName: string;
  section: string;
  title: string;
  description: string;
  deadline: string;
  faculty: string;
  maxMarks: number;
  attachmentUrl: string | null;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  submissionsCount: number;
  totalStudents: number;
  mySubmissionStatus: SubmissionStatus | "PENDING" | null;
  myMarks: number | null;
  myFeedback: string | null;
}

export interface CreateAssignmentInput {
  subjectId: string;
  sectionId: string;
  title: string;
  description: string;
  deadline: string;
  maxMarks: number;
  attachmentUrl?: string;
}

/** GET /assignments/:id/submissions */
export interface AssignmentSubmissions {
  assignment: { id: string; title: string; maxMarks: number; deadline: string };
  students: {
    studentId: string;
    name: string;
    rollNumber: string;
    submission: {
      fileUrl: string;
      submittedAt: string;
      late: boolean;
      status: SubmissionStatus;
      marksObtained: number | null;
      feedback: string | null;
    } | null;
  }[];
}

export const assignmentsApi = {
  list: async (): Promise<Assignment[]> => (await httpClient.get("/assignments")).data,
  create: async (input: CreateAssignmentInput): Promise<Assignment> => (await httpClient.post("/assignments", input)).data,
  close: async (id: string): Promise<Assignment> => (await httpClient.patch(`/assignments/${id}/close`)).data,
  submit: async ({ id, fileUrl }: { id: string; fileUrl: string }) => (await httpClient.post(`/assignments/${id}/submit`, { fileUrl })).data,
  submissions: async (id: string): Promise<AssignmentSubmissions> => (await httpClient.get(`/assignments/${id}/submissions`)).data,
  grade: async ({ id, studentId, marksObtained, feedback }: { id: string; studentId: string; marksObtained: number; feedback?: string }) =>
    (await httpClient.patch(`/assignments/${id}/submissions/${studentId}`, { marksObtained, feedback })).data,
};

export function useAssignments() {
  return useQuery({ queryKey: queryKeys.assignments.list, queryFn: assignmentsApi.list });
}

export function useAssignmentSubmissions(id: string | null) {
  return useQuery({ queryKey: queryKeys.assignments.submissions(id ?? ""), queryFn: () => assignmentsApi.submissions(id!), enabled: Boolean(id) });
}

function useAssignmentsMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all }) });
}

export const useCreateAssignment = () => useAssignmentsMutation(assignmentsApi.create);
export const useCloseAssignment = () => useAssignmentsMutation(assignmentsApi.close);
export const useSubmitAssignment = () => useAssignmentsMutation(assignmentsApi.submit);
export const useGradeSubmission = () => useAssignmentsMutation(assignmentsApi.grade);
