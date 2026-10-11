import { httpClient } from "@/lib/api/http-client";
import type { DebarmentStatus, Student, StudentFilters } from "./types";

export const studentsApi = {
  list: async (filters: StudentFilters = {}): Promise<Student[]> =>
    (await httpClient.get("/students", { params: filters })).data,

  me: async (): Promise<Student> => (await httpClient.get("/students/me")).data,

  updateDebarment: async (studentId: string, status: DebarmentStatus): Promise<Student> =>
    (await httpClient.patch(`/students/${studentId}/debarment`, { status })).data,
};
