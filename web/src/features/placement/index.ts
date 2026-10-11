import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/lib/api/http-client";
import { queryKeys } from "@/lib/api/query-keys";

export type ApplicationStatus = "APPLIED" | "SHORTLISTED" | "INTERVIEW_SCHEDULED" | "OFFERED" | "REJECTED";

/** GET /placement/drives */
export interface PlacementDrive {
  id: string;
  companyName: string;
  companyLogo: string | null;
  industry: string;
  roleTitle: string;
  ctc: string;
  location: string;
  deadline: string;
  minCgpa: number;
  maxBacklogsAllowed: number;
  allowedBatches: string | null;
  status: "LIVE" | "CLOSED";
  registeredCount: number;
  shortlistedCount: number;
  offersCount: number;
  /** Set for students: their own application state for this drive. */
  myApplicationStatus: ApplicationStatus | null;
}

/** GET /placement/applications */
export interface PlacementApplication {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  driveId: string;
  companyName: string;
  roleTitle: string;
  cgpa: number;
  branch: string;
  status: ApplicationStatus;
  offerCtc: string | null;
  loiSigned: boolean;
  loiSignedAt: string | null;
  appliedAt: string;
}

export const placementApi = {
  drives: async (): Promise<PlacementDrive[]> => (await httpClient.get("/placement/drives")).data,
  applications: async (): Promise<PlacementApplication[]> => (await httpClient.get("/placement/applications")).data,
  apply: async (driveId: string): Promise<{ message: string }> =>
    (await httpClient.post(`/placement/drives/${driveId}/apply`)).data,
  signLoi: async (applicationId: string): Promise<{ signedAt: string }> =>
    (await httpClient.post(`/placement/applications/${applicationId}/sign-loi`)).data,
};

export function usePlacementDrives() {
  return useQuery({ queryKey: queryKeys.placement.drives, queryFn: placementApi.drives });
}

export function usePlacementApplications() {
  return useQuery({ queryKey: queryKeys.placement.applications, queryFn: placementApi.applications });
}

export function useApplyToDrive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: placementApi.apply,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.placement.all }),
  });
}

export function useSignLoi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: placementApi.signLoi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.placement.all }),
  });
}
