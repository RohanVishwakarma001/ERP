import { useQuery } from "@tanstack/react-query";
import { httpClient } from "@/lib/api/http-client";
import { queryKeys } from "@/lib/api/query-keys";

/** GET /exams/cycles */
export interface ExamCycle {
  id: string;
  name: string;
  session: string;
  academicYear: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  totalPapers: number;
  totalHalls: number;
  totalSeatings: number;
}

/** GET /exams/schedule */
export interface ExamPaper {
  id: string;
  examTitle: string;
  code: string;
  subject: string;
  date: string;
  time: string;
  type: string;
  maxMarks: number;
  rooms: string[];
}

/** GET /exams/seating */
export interface SeatingHall {
  id: string;
  hallNumber: string;
  block: string;
  capacity: number;
  date: string;
  shift: string;
  subjectCode: string;
  assignedDepartments: string[];
  candidateCount: number;
  invigilators: string[];
}

/** GET /exams/grade-card */
export interface GradeCard {
  studentId: string;
  rollNumber: string;
  studentName: string;
  program: string;
  semester: number;
  academicYear: string | null;
  resultStatus: string;
  publishedAt: string | null;
  sgpa: number | null;
  cgpa: number;
  totalCreditsEarned: number;
  backlogs: number;
  subjects: {
    code: string;
    title: string;
    credits: number;
    internalMarks: number | null;
    externalMarks: number | null;
    totalMarks: number | null;
    maxMarks: number | null;
    grade: string | null;
    gradePoints: number | null;
    status: "PASS" | "FAIL" | "PENDING";
  }[];
}

export const examsApi = {
  cycles: async (): Promise<ExamCycle[]> => (await httpClient.get("/exams/cycles")).data,
  schedule: async (): Promise<ExamPaper[]> => (await httpClient.get("/exams/schedule")).data,
  seating: async (): Promise<SeatingHall[]> => (await httpClient.get("/exams/seating")).data,
  myGradeCard: async (): Promise<GradeCard> => (await httpClient.get("/exams/grade-card")).data,
};

export function useExamCycles() {
  return useQuery({ queryKey: queryKeys.exams.cycles, queryFn: examsApi.cycles });
}

export function useExamSchedule() {
  return useQuery({ queryKey: queryKeys.exams.schedule, queryFn: examsApi.schedule });
}

export function useSeatingHalls() {
  return useQuery({ queryKey: queryKeys.exams.seating, queryFn: examsApi.seating });
}

export function useMyGradeCard() {
  return useQuery({ queryKey: queryKeys.exams.myGradeCard, queryFn: examsApi.myGradeCard });
}
