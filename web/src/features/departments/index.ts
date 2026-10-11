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

export const SUBJECT_TYPES = ["THEORY", "PRACTICAL", "HYBRID"] as const;
export type SubjectType = (typeof SUBJECT_TYPES)[number];

/** GET /departments/curriculum — one course (subject). */
export interface CurriculumSubject {
  id: string;
  code: string;
  name: string;
  credits: number;
  type: SubjectType;
  semester: number;
  department: string;
  departmentId: string;
  programId: string;
  program: string;
}

export interface CreateSubjectInput {
  code: string;
  name: string;
  credits: number;
  semester: number;
  type: SubjectType;
  programId: string;
}

export type UpdateSubjectInput = Partial<Omit<CreateSubjectInput, "programId">>;

export interface CreateDepartmentInput {
  name: string;
  code: string;
  building: string;
  nbaAccredited?: boolean;
}

export type UpdateDepartmentInput = Partial<CreateDepartmentInput>;

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
  subjectCount: number;
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

export type UpdateProgramInput = Partial<Omit<CreateProgramInput, "departmentId">>;

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

export type UpdateSectionInput = Partial<CreateSectionInput>;

export const departmentsApi = {
  list: async (): Promise<Department[]> => (await httpClient.get("/departments")).data,
  curriculum: async (): Promise<CurriculumSubject[]> => (await httpClient.get("/departments/curriculum")).data,
  create: async (input: CreateDepartmentInput): Promise<Department> => (await httpClient.post("/departments", input)).data,
  programs: async (): Promise<Program[]> => (await httpClient.get("/departments/programs")).data,
  createProgram: async (input: CreateProgramInput): Promise<Program[]> => (await httpClient.post("/departments/programs", input)).data,
  sections: async (): Promise<Section[]> => (await httpClient.get("/departments/sections")).data,
  createSection: async (input: CreateSectionInput): Promise<Section[]> => (await httpClient.post("/departments/sections", input)).data,
  update: async ({ id, ...input }: UpdateDepartmentInput & { id: string }): Promise<Department> =>
    (await httpClient.patch(`/departments/${id}`, input)).data,
  remove: async (id: string): Promise<void> => {
    await httpClient.delete(`/departments/${id}`);
  },
  updateProgram: async ({ id, ...input }: UpdateProgramInput & { id: string }): Promise<Program[]> =>
    (await httpClient.patch(`/departments/programs/${id}`, input)).data,
  removeProgram: async (id: string): Promise<Program[]> => (await httpClient.delete(`/departments/programs/${id}`)).data,
  updateSection: async ({ id, ...input }: UpdateSectionInput & { id: string }): Promise<Section[]> =>
    (await httpClient.patch(`/departments/sections/${id}`, input)).data,
  removeSection: async (id: string): Promise<Section[]> => (await httpClient.delete(`/departments/sections/${id}`)).data,
  createSubject: async (input: CreateSubjectInput): Promise<CurriculumSubject[]> => (await httpClient.post("/departments/subjects", input)).data,
  updateSubject: async ({ id, ...input }: UpdateSubjectInput & { id: string }): Promise<CurriculumSubject[]> =>
    (await httpClient.patch(`/departments/subjects/${id}`, input)).data,
  removeSubject: async (id: string): Promise<CurriculumSubject[]> => (await httpClient.delete(`/departments/subjects/${id}`)).data,
};

export function useDepartments() {
  return useQuery({ queryKey: queryKeys.departments.list, queryFn: departmentsApi.list });
}

export function useCurriculum() {
  return useQuery({ queryKey: queryKeys.departments.curriculum, queryFn: departmentsApi.curriculum });
}


export function usePrograms(options: { enabled?: boolean } = {}) {
  return useQuery({ queryKey: queryKeys.departments.programs, queryFn: departmentsApi.programs, enabled: options.enabled ?? true });
}

export function useSections(options: { enabled?: boolean } = {}) {
  return useQuery({ queryKey: queryKeys.departments.sections, queryFn: departmentsApi.sections, enabled: options.enabled ?? true });
}

/**
 * Every academic-structure write refreshes the whole `departments` domain: department
 * cards list program names and counts, programs count courses, and so on.
 */
function useDepartmentsMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.departments.all }) });
}

export const useCreateDepartment = () => useDepartmentsMutation(departmentsApi.create);
export const useUpdateDepartment = () => useDepartmentsMutation(departmentsApi.update);
export const useDeleteDepartment = () => useDepartmentsMutation(departmentsApi.remove);
export const useCreateProgram = () => useDepartmentsMutation(departmentsApi.createProgram);
export const useUpdateProgram = () => useDepartmentsMutation(departmentsApi.updateProgram);
export const useDeleteProgram = () => useDepartmentsMutation(departmentsApi.removeProgram);
export const useCreateSection = () => useDepartmentsMutation(departmentsApi.createSection);
export const useUpdateSection = () => useDepartmentsMutation(departmentsApi.updateSection);
export const useDeleteSection = () => useDepartmentsMutation(departmentsApi.removeSection);
export const useCreateSubject = () => useDepartmentsMutation(departmentsApi.createSubject);
export const useUpdateSubject = () => useDepartmentsMutation(departmentsApi.updateSubject);
export const useDeleteSubject = () => useDepartmentsMutation(departmentsApi.removeSubject);
