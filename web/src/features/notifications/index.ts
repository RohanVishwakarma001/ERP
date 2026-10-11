import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/lib/api/http-client";

/** GET /notifications */
export interface NotificationFeed {
  unreadCount: number;
  items: {
    id: string;
    title: string;
    message: string;
    category: string;
    link: string | null;
    isRead: boolean;
    createdAt: string;
  }[];
}

const NOTIFICATIONS_KEY = ["notifications"] as const;

export const notificationsApi = {
  feed: async (): Promise<NotificationFeed> => (await httpClient.get("/notifications")).data,
  markAllRead: async (): Promise<void> => {
    await httpClient.patch("/notifications/read-all");
  },
};

export function useNotificationFeed(enabled = true) {
  return useQuery({ queryKey: NOTIFICATIONS_KEY, queryFn: notificationsApi.feed, enabled, refetchInterval: 120_000 });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });
}
