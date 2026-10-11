import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/lib/api/http-client";
import { queryKeys } from "@/lib/api/query-keys";
import { downloadAuthenticatedFile } from "@/lib/download";

export type AdmitCardStatus = "APPROVED" | "REVOKED";

export interface FeeSummary {
  billed: boolean;
  totalBilled: number;
  pending: number;
  overdue: boolean;
  cleared: boolean;
}

/** GET /admit-cards?examId= (administrators) */
export interface AdmitCardCandidate {
  studentId: string;
  name: string;
  email: string;
  rollNumber: string;
  program: string;
  semester: number;
  section: string | null;
  attendance: number;
  isDebarred: boolean;
  fees: FeeSummary;
  blockers: ("FEES_OUTSTANDING" | "DEBARRED")[];
  admitCard: {
    id: string;
    status: AdmitCardStatus;
    cardNumber: string;
    approvedAt: string;
    revokedAt: string | null;
    overridden: boolean;
    remarks: string | null;
  } | null;
}

export interface ExamCandidates {
  exam: { id: string; title: string; cycle: string; academicYear: string; status: string; papers: number };
  candidates: AdmitCardCandidate[];
}

/** GET /admit-cards/me (students) */
export interface MyExams {
  fees: FeeSummary;
  isDebarred: boolean;
  exams: {
    examId: string;
    title: string;
    cycle: string;
    academicYear: string;
    status: string;
    papers: { id: string; code: string; name: string; date: string; startTime: string; endTime: string }[];
    admitCard: { id: string; status: AdmitCardStatus; cardNumber: string; approvedAt: string; remarks: string | null } | null;
  }[];
}

export interface ApproveResult {
  approved: number;
  skipped: { studentId: string; name: string | null; reason: string }[];
}

export const admitCardsApi = {
  forExam: async (examId: string): Promise<ExamCandidates> => (await httpClient.get("/admit-cards", { params: { examId } })).data,
  mine: async (): Promise<MyExams> => (await httpClient.get("/admit-cards/me")).data,
  approve: async (input: { examId: string; studentIds: string[]; overrideReason?: string }): Promise<ApproveResult> =>
    (await httpClient.post("/admit-cards/approve", input)).data,
  revoke: async ({ id, reason }: { id: string; reason: string }) => (await httpClient.post(`/admit-cards/${id}/revoke`, { reason })).data,
  download: (id: string, rollNumber = "admit-card") => downloadAuthenticatedFile(`/admit-cards/${id}/pdf`, `${rollNumber}.pdf`),
};

export function useExamCandidates(examId: string | null) {
  return useQuery({
    queryKey: queryKeys.admitCards.forExam(examId ?? ""),
    queryFn: () => admitCardsApi.forExam(examId!),
    enabled: Boolean(examId),
  });
}

export function useMyExams() {
  return useQuery({ queryKey: queryKeys.admitCards.mine, queryFn: admitCardsApi.mine });
}

function useAdmitCardMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.admitCards.all }) });
}

export const useApproveAdmitCards = () => useAdmitCardMutation(admitCardsApi.approve);
export const useRevokeAdmitCard = () => useAdmitCardMutation(admitCardsApi.revoke);

export function useDownloadAdmitCard() {
  return useMutation({ mutationFn: ({ id, rollNumber }: { id: string; rollNumber?: string }) => admitCardsApi.download(id, rollNumber) });
}
