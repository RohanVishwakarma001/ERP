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

/** GET /departments/programs */
export interface Program {
  id: string;
  code: string;
  name: string;
  departmentId: string;
  departmentCode: string;
  durationYears: number;
  totalSemesters: number;
  degreeType: DegreeType;
  studentCount: number;
}

export const DEGREE_TYPES = ["DIPLOMA", "UNDERGRADUATE", "POSTGRADUATE", "DOCTORAL"] as const;
export type DegreeType = (typeof DEGREE_TYPES)[number];

export interface CreateProgramInput {
  name: string;
  code: string;
  departmentId: string;
  durationYears: number;
  totalSemesters: number;
  degreeType: DegreeType;
}

/** GET /departments/sections */
export interface Section {
  id: string;
  name: string;
  semester: number;
  academicYear: string;
  capacity: number;
  studentCount: number;
}

export interface CreateSectionInput {
  name: string;
  semester: number;
  academicYear: string;
  capacity: number;
}

export const departmentsApi = {
  list: async (): Promise<Department[]> => (await httpClient.get("/departments")).data,
  curriculum: async (): Promise<CurriculumSubject[]> => (await httpClient.get("/departments/curriculum")).data,
  create: async (input: CreateDepartmentInput): Promise<Department> => (await httpClient.post("/departments", input)).data,
  programs: async (): Promise<Program[]> => (await httpClient.get("/departments/programs")).data,
  createProgram: async (input: CreateProgramInput): Promise<Program[]> => (await httpClient.post("/departments/programs", input)).data,
  sections: async (): Promise<Section[]> => (await httpClient.get("/departments/sections")).data,
  createSection: async (input: CreateSectionInput): Promise<Section[]> => (await httpClient.post("/departments/sections", input)).data,
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

export function usePrograms(options: { enabled?: boolean } = {}) {
  return useQuery({ queryKey: queryKeys.departments.programs, queryFn: departmentsApi.programs, enabled: options.enabled ?? true });
}

export function useSections(options: { enabled?: boolean } = {}) {
  return useQuery({ queryKey: queryKeys.departments.sections, queryFn: departmentsApi.sections, enabled: options.enabled ?? true });
}

export function useCreateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: departmentsApi.createProgram,
    // Department cards list program names, so refresh the whole domain.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.departments.all }),
  });
}

export function useCreateSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: departmentsApi.createSection,
    onSuccess: (sections) => queryClient.setQueryData(queryKeys.departments.sections, sections),
  });
}
