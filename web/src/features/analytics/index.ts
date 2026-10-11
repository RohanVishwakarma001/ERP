import { useQuery } from "@tanstack/react-query";
import { httpClient } from "@/lib/api/http-client";
import { queryKeys } from "@/lib/api/query-keys";

/** GET /analytics/executive */
export interface ExecutiveSummary {
  totalEnrolledStudents: number;
  activeFacultyCount: number;
  departmentsCount: number;
  overallCampusAttendance: number | null;
  debarredStudentsCount: number;
  totalFeeBilled: number;
  totalFeeCollected: number;
  feeCollectionRate: number | null;
  placementOffersCount: number;
}

/** GET /analytics/department/:code */
export interface DepartmentSummary {
  department: string;
  departmentName: string;
  totalStudents: number;
  totalFaculty: number;
  averageAttendance: number | null;
  lowAttendanceCount: number;
  pendingLeaveRequests: number;
  pendingCorrectionPetitions: number;
}

export const analyticsApi = {
  executive: async (): Promise<ExecutiveSummary> => (await httpClient.get("/analytics/executive")).data,
  department: async (code: string): Promise<DepartmentSummary> => (await httpClient.get(`/analytics/department/${code}`)).data,
};

export function useExecutiveSummary() {
  return useQuery({ queryKey: queryKeys.analytics.executive, queryFn: analyticsApi.executive });
}

export function useDepartmentSummary(code: string | undefined) {
  return useQuery({
    queryKey: queryKeys.analytics.department(code ?? ""),
    queryFn: () => analyticsApi.department(code!),
    enabled: Boolean(code),
  });
}
