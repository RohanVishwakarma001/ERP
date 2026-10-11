import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/lib/api/http-client";
import { queryKeys } from "@/lib/api/query-keys";
import type { UserRole } from "@/types";

export type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "LOCKED";

/** GET /users */
export interface Account {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
  department: string | null;
  program: string | null;
  /** Roll number, employee code or employee id. */
  identifier: string | null;
  designation: string | null;
  /** Super admin / admin defined in the server .env — not editable in the app. */
  managedByEnv: boolean;
}

export interface UserFilters {
  role?: UserRole;
  search?: string;
}

/** POST /users — role-specific fields are required only for that role. */
export interface CreateAccountInput {
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  password: string;
  // Student
  programId?: string;
  sectionId?: string;
  rollNumber?: string;
  enrollmentNumber?: string;
  semester?: number;
  admissionYear?: number;
  guardianName?: string;
  guardianPhone?: string;
  // Faculty / HOD
  departmentId?: string;
  employeeCode?: string;
  qualification?: string;
  specialization?: string;
  // Faculty / HOD / staff
  designation?: string;
  // Staff
  employeeId?: string;
}

export const usersApi = {
  list: async (filters: UserFilters): Promise<Account[]> => (await httpClient.get("/users", { params: filters })).data,
  create: async (input: CreateAccountInput): Promise<Account> => (await httpClient.post("/users", input)).data,
  setStatus: async ({ id, status }: { id: string; status: Exclude<AccountStatus, "LOCKED"> }): Promise<Account> =>
    (await httpClient.patch(`/users/${id}/status`, { status })).data,
};

export function useAccounts(filters: UserFilters) {
  return useQuery({ queryKey: queryKeys.users.list({ ...filters }), queryFn: () => usersApi.list(filters) });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.create,
    onSuccess: (account) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      // New students/faculty change rosters and department headcounts.
      if (account.role === "STUDENT") queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
      if (account.role === "FACULTY" || account.role === "HOD") queryClient.invalidateQueries({ queryKey: queryKeys.faculty.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
    },
  });
}

export function useSetAccountStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.setStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
  });
}
