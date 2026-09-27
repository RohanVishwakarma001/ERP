export * from "./auth";

export interface Department {
  id: string;
  name: string;
  code: string;
  hodName: string;
  hodEmail: string;
  facultyCount: number;
  studentCount: number;
  fsrRatio: string;
  accreditationStatus: "NBA Tier-1" | "NAAC A+" | "In Progress" | "Affiliated";
  programs: string[];
  intakeCapacity: number;
  averageAttendance: number;
  budgetUtilization: number;
  building?: string;
  nbaAccredited?: boolean;
}

export interface Student {
  id: string;
  rollNumber: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  program: string;
  semester: number;
  section: string;
  batch: string;
  cgpa: number;
  attendancePercent: number;
  conductedClasses: number;
  attendedClasses: number;
  debarmentStatus: "ELIGIBLE" | "CONDONATION" | "DEBARRED";
  hallTicketStatus: "RELEASED" | "WITHHELD" | "UNDER_REVIEW";
  medicalLeavesPending: number;
  feesDue: number;
  avatarUrl: string;
  address: string;
}

export interface FacultyMember {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  qualification: string;
  specialization: string;
  weeklyWorkloadHours: number;
  maxWorkloadHours: number;
  activePeriodsCount: number;
  assignedSubjects: {
    code: string;
    name: string;
    semester: number;
    section: string;
  }[];
  avatarUrl: string;
  status: "ACTIVE" | "ON_LEAVE";
}

export interface SubjectAttendance {
  subjectCode: string;
  subjectName: string;
  facultyName: string;
  conducted: number;
  attended: number;
  percentage: number;
  status: "SAFE" | "WARNING" | "CRITICAL" | "EXCELLENT";
  requiredToReach75: number;
}

export interface TimetablePeriod {
  id: string;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
  periodNumber: number;
  timeSlot: string;
  subjectCode: string;
  subjectName: string;
  facultyName: string;
  facultyId: string;
  roomNumber: string;
  batchSection: string;
  type: "THEORY" | "LAB" | "TUTORIAL";
  isCancelled?: boolean;
}

export interface ExaminationCycle {
  id: string;
  name: string;
  session: string;
  academicYear: string;
  status: "UPCOMING" | "ONGOING" | "COMPLETED" | "LOCKED";
  startDate: string;
  endDate: string;
  totalCandidates: number;
  totalHalls: number;
  markLockingClearedCount: number;
  totalPortalsCount: number;
  admitCardsReleasedPercent: number;
}

export interface SeatingHallAllocation {
  id: string;
  hallNumber: string;
  block: string;
  capacity: number;
  shift: "Morning (09:30 - 12:30)" | "Evening (01:30 - 04:30)";
  assignedDepartments: string[];
  candidateCount: number;
  chiefSuperintendent: string;
  invigilators: string[];
  isLocked: boolean;
}

export interface PlacementDrive {
  id: string;
  companyName: string;
  companyLogo: string;
  tier: "Super Dream" | "Dream" | "Regular";
  roleTitle: string;
  ctc: string;
  location: string;
  driveDate: string;
  deadline: string;
  minCgpa: number;
  maxBacklogsAllowed: number;
  eligibleBranches: string[];
  registeredCount: number;
  shortlistedCount: number;
  offersCount: number;
  status: "UPCOMING" | "LIVE" | "CLOSED";
  description: string;
  rounds: string[];
}

export interface CandidateApplication {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  driveId: string;
  companyName: string;
  roleTitle: string;
  cgpa: number;
  branch: string;
  currentRound: string;
  status: "APPLIED" | "SHORTLISTED" | "INTERVIEWING" | "OFFERED" | "REJECTED";
  offerCtc?: string;
  loiSigned?: boolean;
  digilockerVerified?: boolean;
  evaluations?: {
    technical: number;
    coding: number;
    communication: number;
    comments: string;
  };
}

export interface FeeLedgerItem {
  id: string;
  category: "Tuition" | "Hostel & Mess" | "Transport Bus" | "Examination" | "Library & Labs";
  amountDue: number;
  amountPaid: number;
  status: "PAID" | "PENDING" | "OVERDUE";
  dueDate: string;
  lastPaymentDate?: string;
  transactionRef?: string;
}

export interface CampusNotice {
  id: string;
  title: string;
  category: "ACADEMIC" | "EXAMINATION" | "PLACEMENT" | "ADMINISTRATION" | "HOSTEL";
  publisher: string;
  date: string;
  priority: "HIGH" | "NORMAL" | "URGENT";
  summary: string;
  documentUrl?: string;
  isUnread?: boolean;
  isUrgent?: boolean;
  publishedAt?: string;
}

export interface ComplaintTicket {
  id: string;
  ticketNumber: string;
  title: string;
  category: "HOSTEL" | "ACADEMIC" | "TRANSPORT" | "INFRASTRUCTURE" | "FINANCE";
  description: string;
  reportedBy: string;
  reportedByRole: string;
  createdAt: string;
  status: "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assignedTo?: string;
  resolutionNotes?: string;
}

export interface HostelBedAllocation {
  id: string;
  buildingName: string;
  roomNumber: string;
  floor: number;
  bedNumber: string;
  studentName?: string;
  studentRoll?: string;
  studentBranch?: string;
  wardenName: string;
  status: "OCCUPIED" | "VACANT" | "MAINTENANCE";
}

export interface TransportRoute {
  id: string;
  busNumber: string;
  driverName: string;
  driverPhone: string;
  routeTitle: string;
  stops: string[];
  capacity: number;
  currentOccupancy: number;
  currentLocation: string;
  etaToCampusMinutes: number;
  status: "ON_ROUTE" | "AT_CAMPUS" | "STANDBY";
}

export interface LibraryBookItem {
  id: string;
  accessionNumber: string;
  title: string;
  authors: string[];
  department: string;
  edition: string;
  totalCopies: number;
  availableCopies: number;
  shelfLocation: string;
}

export interface GradeCardData {
  rollNumber: string;
  studentName: string;
  program: string;
  semester: number;
  sgpa: number;
  cgpa: number;
  totalCreditsEarned: number;
  utuAffiliationNode: string;
  digitalVerificationHash: string;
  subjects: {
    code: string;
    title: string;
    credits: number;
    internalMarks: number;
    externalMarks: number;
    totalMarks: number;
    grade: string;
    gradePoints: number;
    status: "PASS" | "FAIL" | "BACKLOG";
  }[];
}

export interface AIResponse {
  query: string;
  answer: string;
  category: "ATTENDANCE" | "EXAM" | "FEE" | "SYLLABUS" | "HOSTEL" | "GENERAL";
  dataCard?: {
    title: string;
    metrics: { label: string; value: string; color?: string }[];
    badgeText?: string;
    actionText?: string;
    actionUrl?: string;
  };
}
