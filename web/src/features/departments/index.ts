import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/lib/api/http-client";
import { queryKeys } from "@/lib/api/query-keys";

/** GET /departments */
export interface Department {
  id: string;
  code: string;
  name: string;
  building: string;
  hodName: string | null;
  hodEmail: string | null;
  facultyCount: number;
  studentCount: number;
  fsrRatio: string | null;
  nbaAccredited: boolean;
  accreditationStatus: string;
  programs: string[];
  budgetAllocated: number;
  budgetSpent: number;
  budgetUtilization: number | null;
  averageAttendance: number | null;
}

/** GET /departments/curriculum */
export interface CurriculumSubject {
  code: string;
  name: string;
  credits: number;
  type: "THEORY" | "PRACTICAL" | "HYBRID";
  semester: number;
  department: string;
}

export interface CreateDepartmentInput {
  name: string;
  code: string;
  building: string;
  nbaAccredited?: boolean;
}

export const departmentsApi = {
  list: async (): Promise<Department[]> => (await httpClient.get("/departments")).data,
  curriculum: async (): Promise<CurriculumSubject[]> => (await httpClient.get("/departments/curriculum")).data,
  create: async (input: CreateDepartmentInput): Promise<Department> => (await httpClient.post("/departments", input)).data,
};

export function useDepartments() {
  return useQuery({ queryKey: queryKeys.departments.list, queryFn: departmentsApi.list });
}

export function useCurriculum() {
  return useQuery({ queryKey: queryKeys.departments.curriculum, queryFn: departmentsApi.curriculum });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: departmentsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.departments.all }),
  });
}
