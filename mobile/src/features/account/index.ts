import { useMutation, useQuery } from '@tanstack/react-query';
import { openBrowserAsync } from 'expo-web-browser';
import { httpClient } from '@/lib/api/http-client';
import { queryKeys } from '@/lib/api/query-keys';
import { env } from '@/config/env';
import type { UserRole } from '@/types';

/** GET /profile — mirrors web/src/features/profile. */
export interface Profile {
  account: { id: string; name: string; email: string; phone: string | null; role: UserRole; status: string; memberSince: string | null; managedByEnv: boolean };
  student: {
    rollNumber: string;
    enrollmentNumber: string;
    department: { code: string; name: string };
    program: { code: string; name: string; degreeType: string };
    section: string | null;
    semester: number;
    totalSemesters: number;
    admissionYear: number;
    cgpa: number;
    overallAttendance: number;
    isDebarred: boolean;
    kycVerified: boolean;
    guardianName: string | null;
    guardianPhone: string | null;
    fees: { pendingDues: number | null; overdue: boolean };
    hostel: { building: string; room: string; bed: string } | null;
    transport: { route: string; bus: string; pickupStop: string; passNumber: string; validUntil: string | null } | null;
  } | null;
  faculty: {
    employeeCode: string;
    department: { code: string; name: string };
    designation: string;
    qualification: string;
    specialization: string | null;
    weeklyHoursNorm: number;
    subjects: { code: string; name: string; semester: number }[];
  } | null;
  staff: { employeeId: string | null; designation: string } | null;
}

export type FeeStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';

/** GET /fees/me */
export interface MyFees {
  totalFee: number;
  paidFee: number;
  pendingDues: number;
  nextDueDate: string | null;
  clearanceStatus: 'CLEARED' | 'PENDING';
  accounts: { id: string; semester: number; academicYear: string; totalAmount: number; paidAmount: number; pendingAmount: number; dueDate: string; status: FeeStatus }[];
  recentTransactions: { id: string; date: string; amount: number; receiptNumber: string | null; mode: string }[];
}

/** GET /admit-cards/me */
export interface MyExams {
  fees: { billed: boolean; pending: number; overdue: boolean; cleared: boolean };
  isDebarred: boolean;
  exams: {
    examId: string;
    title: string;
    cycle: string;
    academicYear: string;
    status: string;
    papers: { id: string; code: string; name: string; date: string; startTime: string; endTime: string }[];
    admitCard: { id: string; status: 'APPROVED' | 'REVOKED'; cardNumber: string; approvedAt: string; remarks: string | null } | null;
  }[];
}

export const accountApi = {
  profile: async (): Promise<Profile> => (await httpClient.get('/profile')).data,
  myFees: async (): Promise<MyFees> => (await httpClient.get('/fees/me')).data,
  myExams: async (): Promise<MyExams> => (await httpClient.get('/admit-cards/me')).data,
  /**
   * The in-app browser can't send the bearer token, so ask the API for a
   * five-minute signed link and open that; the PDF downloads or previews there.
   */
  openAdmitCard: async (admitCardId: string) => {
    const { path } = (await httpClient.post<{ path: string }>(`/admit-cards/${admitCardId}/download-link`)).data;
    await openBrowserAsync(`${env.apiUrl}${path}`);
  },
};

export function useProfile(enabled = true) {
  return useQuery({ queryKey: queryKeys.account.profile, queryFn: accountApi.profile, enabled });
}

export function useMyFees(enabled = true) {
  return useQuery({ queryKey: queryKeys.account.fees, queryFn: accountApi.myFees, enabled });
}

export function useMyExams(enabled = true) {
  return useQuery({ queryKey: queryKeys.account.exams, queryFn: accountApi.myExams, enabled });
}

export function useOpenAdmitCard() {
  return useMutation({ mutationFn: accountApi.openAdmitCard });
}
