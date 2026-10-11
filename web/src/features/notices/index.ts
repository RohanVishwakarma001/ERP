import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/lib/api/http-client";
import { queryKeys } from "@/lib/api/query-keys";

/** Matches the backend's NoticeCategory enum. */
export const NOTICE_CATEGORIES = ["ACADEMIC", "EXAM", "PLACEMENT", "CIRCULAR", "EMERGENCY"] as const;
export type NoticeCategory = (typeof NOTICE_CATEGORIES)[number];

export const NOTICE_CATEGORY_LABELS: Record<NoticeCategory, string> = {
  ACADEMIC: "Academic",
  EXAM: "Examination",
  PLACEMENT: "Placement",
  CIRCULAR: "Circular",
  EMERGENCY: "Emergency",
};

/** GET /notices */
export interface Notice {
  id: string;
  title: string;
  summary: string;
  category: NoticeCategory;
  authorName: string;
  isUrgent: boolean;
  publishedAt: string;
}

export interface CreateNoticeInput {
  title: string;
  summary: string;
  category: NoticeCategory;
  isUrgent?: boolean;
  authorName?: string;
}

export const noticesApi = {
  list: async (): Promise<Notice[]> => (await httpClient.get("/notices")).data,
  create: async (input: CreateNoticeInput): Promise<Notice> => (await httpClient.post("/notices", input)).data,
};

export function useNotices() {
  return useQuery({ queryKey: queryKeys.notices.list, queryFn: noticesApi.list });
}

export function useCreateNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: noticesApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notices.all }),
  });
}
