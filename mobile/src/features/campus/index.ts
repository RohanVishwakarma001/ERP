/** Timetable, notices, placements and the AI copilot. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@/lib/api/http-client';
import { queryKeys } from '@/lib/api/query-keys';
import type { NoticeItem, PlacementDriveItem, TimetableSlot, TodaySlot } from '@/types';

export const campusApi = {
  todaySchedule: async (): Promise<TodaySlot[]> => (await httpClient.get('/timetable/today')).data,
  myTimetable: async (): Promise<TimetableSlot[]> => (await httpClient.get('/timetable/my')).data,
  notices: async (): Promise<NoticeItem[]> => (await httpClient.get('/notices')).data,
  drives: async (): Promise<PlacementDriveItem[]> => (await httpClient.get('/placement/drives')).data,
  applyToDrive: async (driveId: string): Promise<{ message: string }> =>
    (await httpClient.post(`/placement/drives/${driveId}/apply`)).data,
  askCopilot: async (query: string): Promise<{ answer: string }> => (await httpClient.post('/ai/chat', { query })).data,
  notifications: async (): Promise<NotificationFeed> => (await httpClient.get('/notifications')).data,
  markAllNotificationsRead: async (): Promise<void> => {
    await httpClient.patch('/notifications/read-all');
  },
};

/** GET /notifications */
export interface NotificationFeed {
  unreadCount: number;
  items: { id: string; title: string; message: string; isRead: boolean; createdAt: string }[];
}

export const useNotifications = () =>
  useQuery({ queryKey: queryKeys.notifications, queryFn: campusApi.notifications, refetchInterval: 120_000 });

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: campusApi.markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}

export const useTodaySchedule = () =>
  useQuery({ queryKey: queryKeys.timetable.today, queryFn: campusApi.todaySchedule, refetchInterval: 60_000 });

export const useMyTimetable = () => useQuery({ queryKey: queryKeys.timetable.mine, queryFn: campusApi.myTimetable });

export const useNotices = () => useQuery({ queryKey: queryKeys.notices, queryFn: campusApi.notices });

export const usePlacementDrives = () => useQuery({ queryKey: queryKeys.placement.drives, queryFn: campusApi.drives });

export function useApplyToDrive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: campusApi.applyToDrive,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.placement.drives }),
  });
}

/** The copilot shows failures inside the conversation, so the global alert is suppressed. */
export const useAskCopilot = () => useMutation({ mutationFn: campusApi.askCopilot, meta: { silentError: true } });

/** Mirrors backend complaints DTO (COMPLAINT_CATEGORIES / COMPLAINT_PRIORITIES). */
export const COMPLAINT_CATEGORIES = ['ACADEMIC', 'HOSTEL', 'TRANSPORT', 'INFRASTRUCTURE', 'FINANCE', 'RAGGING'] as const;
export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];

export interface CreateComplaintInput {
  category: ComplaintCategory;
  title: string;
  description: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export interface ComplaintTicket {
  id: string;
  ticketNumber: string;
  title: string;
  category: ComplaintCategory;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
}

export const complaintsApi = {
  mine: async (): Promise<ComplaintTicket[]> => (await httpClient.get('/complaints')).data,
  create: async (input: CreateComplaintInput): Promise<ComplaintTicket> => (await httpClient.post('/complaints', input)).data,
};

export const useMyComplaints = (enabled: boolean) => useQuery({ queryKey: queryKeys.complaints, queryFn: complaintsApi.mine, enabled });

export function useCreateComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: complaintsApi.create,
    // The form shows the error inline, so the global error alert is suppressed.
    meta: { silentError: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.complaints }),
  });
}
