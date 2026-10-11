import { apiClient } from "./api-client";
import {
  Department,
  Student,
  FacultyMember,
  SubjectAttendance,
  TimetablePeriod,
  ExaminationCycle,
  SeatingHallAllocation,
  GradeCardData,
  PlacementDrive,
  CandidateApplication,
  FeeLedgerItem,
  CampusNotice,
  ComplaintTicket,
  HostelBedAllocation,
  TransportRoute,
  LibraryBookItem,
  AIResponse,
} from "@/types";

// 1. Department Service
export const departmentService = {
  async getDepartments(): Promise<Department[]> {
    const res = await apiClient.get<Department[]>("/departments");
    return res.data;
  },

  async addDepartment(dept: Partial<Department>): Promise<Department> {
    const res = await apiClient.post<Department>("/departments", dept);
    return res.data;
  },
};

// 2. Student Service
export const studentService = {
  async getStudents(): Promise<Student[]> {
    const res = await apiClient.get<Student[]>("/students");
    return res.data;
  },

  async getStudentById(id: string): Promise<Student> {
    const res = await apiClient.get<Student>(`/students/${id}`);
    return res.data;
  },

  async updateDebarmentStatus(
    studentId: string,
    status: Student["debarmentStatus"]
  ): Promise<Student> {
    const res = await apiClient.patch<Student>(`/students/${studentId}/debarment`, { status });
    return res.data;
  },

  async toggleHallTicket(studentId: string): Promise<Student> {
    const res = await apiClient.post<Student>(`/students/${studentId}/toggle-hall-ticket`);
    return res.data;
  },
};

// 3. Faculty Service
export const facultyService = {
  async getFacultyList(): Promise<FacultyMember[]> {
    const res = await apiClient.get<FacultyMember[]>("/faculty");
    return res.data;
  },
};

// 4. Attendance Service
export const attendanceService = {
  async getStudentAttendance(): Promise<SubjectAttendance[]> {
    const res = await apiClient.get<SubjectAttendance[]>("/attendance/student");
    return res.data;
  },

  async getAttendanceCorrections(): Promise<any[]> {
    const res = await apiClient.get("/attendance/corrections");
    return res.data;
  },

  async submitAttendanceBatch(data: {
    subjectCode: string;
    section: string;
    period: number;
    records: { studentId: string; status: "PRESENT" | "ABSENT" | "LATE" }[];
  }) {
    const res = await apiClient.post("/attendance/batch", data);
    return res.data;
  },

  async scanQr(qrToken: string, userLat?: number, userLng?: number) {
    const res = await apiClient.post<{ success: boolean; message: string; subject: string }>(
      "/attendance/qr/scan",
      { qrToken, userLat, userLng }
    );
    return res.data;
  },

  async generateQrSession(data: {
    subjectCode: string;
    section: string;
    period: number;
    latitude?: number;
    longitude?: number;
  }) {
    const res = await apiClient.post<{
      qrCodeToken: string;
      expiresInSeconds: number;
      expiresAt: string;
      sessionId: string;
    }>("/attendance/qr/session", data);
    return res.data;
  },
};

// 5. Timetable Service
export const timetableService = {
  async getTimetable(): Promise<TimetablePeriod[]> {
    const res = await apiClient.get<TimetablePeriod[]>("/timetable");
    return res.data;
  },

  async lockAndPublish(): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.post("/timetable/lock");
    return res.data;
  },
};

// 6. Examination Service
export const examService = {
  async getCycles(): Promise<ExaminationCycle[]> {
    const res = await apiClient.get<ExaminationCycle[]>("/exams/cycles");
    return res.data;
  },

  async getSeatingHalls(): Promise<SeatingHallAllocation[]> {
    const res = await apiClient.get<SeatingHallAllocation[]>("/exams/seating");
    return res.data;
  },

  async getGradeCard(): Promise<GradeCardData> {
    const res = await apiClient.get<GradeCardData>("/exams/grade-card");
    return res.data;
  },

  async lockMarksToUTU(): Promise<{ success: boolean; hash: string }> {
    const res = await apiClient.post("/exams/lock-marks");
    return res.data;
  },
};

// 7. Placement Service
export const placementService = {
  async getDrives(): Promise<PlacementDrive[]> {
    const res = await apiClient.get<PlacementDrive[]>("/placement/drives");
    return res.data;
  },

  async getApplications(): Promise<CandidateApplication[]> {
    const res = await apiClient.get<CandidateApplication[]>("/placement/applications");
    return res.data;
  },

  async applyToDrive(driveId: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.post(`/placement/drives/${driveId}/apply`);
    return res.data;
  },

  async signLoi(applicationId: string): Promise<{ success: boolean; receiptHash: string }> {
    const res = await apiClient.post(`/placement/applications/${applicationId}/sign-loi`);
    return res.data;
  },
};

// 8. Fee Service
export const feeService = {
  async getFeeLedger(): Promise<FeeLedgerItem[]> {
    const res = await apiClient.get<FeeLedgerItem[]>("/fees");
    return res.data;
  },

  async getMyFees(): Promise<any> {
    const res = await apiClient.get("/fees/me");
    return res.data;
  },

  async createOrder(amount: number): Promise<{ orderId: string; amount: number; currency: string; keyId: string }> {
    const res = await apiClient.post("/fees/orders", { amount });
    return res.data;
  },

  async verifyPayment(data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<{ success: boolean; message: string; receiptNumber: string }> {
    const res = await apiClient.post("/fees/verify", data);
    return res.data;
  },
};

// 9. Notice Service
export const noticeService = {
  async getNotices(): Promise<CampusNotice[]> {
    const res = await apiClient.get<CampusNotice[]>("/notices");
    return res.data;
  },

  async createNotice(notice: Partial<CampusNotice>): Promise<CampusNotice> {
    const res = await apiClient.post<CampusNotice>("/notices", notice);
    return res.data;
  },
};

// 10. Operations Services (Hostel, Transport, Library, Complaints)
export const operationsService = {
  async getHostelRooms(): Promise<HostelBedAllocation[]> {
    const res = await apiClient.get("/hostel/rooms");
    return res.data;
  },

  async getTransportRoutes(): Promise<TransportRoute[]> {
    const res = await apiClient.get("/transport/routes");
    return res.data;
  },

  async getLibraryBooks(): Promise<LibraryBookItem[]> {
    const res = await apiClient.get("/library/books");
    return res.data;
  },

  async getComplaints(): Promise<ComplaintTicket[]> {
    const res = await apiClient.get("/complaints");
    return res.data;
  },
};

// 11. AI Campus Copilot Service
export const aiService = {
  async askQuery(query: string): Promise<AIResponse> {
    const res = await apiClient.post<AIResponse>("/ai/chat", { query });
    return res.data;
  },
};
