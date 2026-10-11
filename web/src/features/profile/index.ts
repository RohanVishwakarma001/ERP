import { useMutation, useQuery } from "@tanstack/react-query";
import { httpClient } from "@/lib/api/http-client";
import { queryKeys } from "@/lib/api/query-keys";
import type { UserRole } from "@/types";

/** GET /profile — the signed-in user's own record. */
export interface Profile {
  account: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: UserRole;
    status: string;
    memberSince: string | null;
    managedByEnv: boolean;
  };
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

export const profileApi = {
  get: async (): Promise<Profile> => (await httpClient.get("/profile")).data,
  changePassword: async (input: { oldPassword: string; newPassword: string }): Promise<{ passwordChanged: true }> =>
    (await httpClient.post("/profile/password", input)).data,
};

export function useProfile() {
  return useQuery({ queryKey: queryKeys.profile.me, queryFn: profileApi.get });
}

export function useChangeOwnPassword() {
  return useMutation({ mutationFn: profileApi.changePassword });
}
