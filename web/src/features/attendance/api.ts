import { httpClient } from "@/lib/api/http-client";
import type { AttendancePetition, ClassPeriod, CreatePetitionInput, QrSession, ScanResult, SubjectAttendance } from "./types";

export const attendanceApi = {
  mySubjects: async (): Promise<SubjectAttendance[]> => (await httpClient.get("/attendance/student")).data,

  myPetitions: async (): Promise<AttendancePetition[]> => (await httpClient.get("/attendance/petitions/me")).data,

  createPetition: async (input: CreatePetitionInput): Promise<AttendancePetition> =>
    (await httpClient.post("/attendance/petitions", input)).data,

  pendingCorrections: async (): Promise<AttendancePetition[]> => (await httpClient.get("/attendance/corrections")).data,

  scanQr: async (qrToken: string, location: { lat?: number; lng?: number }): Promise<ScanResult> =>
    (await httpClient.post("/attendance/qr/scan", { qrToken, userLat: location.lat, userLng: location.lng })).data,

  startQrSession: async (period: ClassPeriod): Promise<QrSession> =>
    (await httpClient.post("/attendance/qr/session", period)).data,
};
