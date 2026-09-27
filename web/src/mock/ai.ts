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

export const MOCK_AI_RESPONSES: Record<string, AIResponse> = {
  attendance: {
    query: "How many classes do I need to attend to reach 75% attendance?",
    answer: "You currently have 84.6% overall attendance (139/164 classes attended), which is safely above the 75.0% threshold. However, for Compiler Design (CS-601), your attendance is 62.5% (20/32 classes). You must attend the next 6 consecutive classes to restore it above the 75% UTU Ordinance criterion.",
    category: "ATTENDANCE",
    dataCard: {
      title: "Real-time ERP Record • Sem 6",
      metrics: [
        { label: "Overall Attendance", value: "84.6%", color: "text-status-success" },
        { label: "CS-601 Attendance", value: "62.5%", color: "text-secondary" },
        { label: "Required Consecutive", value: "+6 Classes", color: "text-primary" },
      ],
      badgeText: "Safe Overall • CS-601 Warning",
      actionText: "View Detailed Attendance",
      actionUrl: "/student/attendance",
    },
  },
  exams: {
    query: "When is my Cloud Computing mid-term?",
    answer: "Your Cloud Computing & Distributed Systems (CS-602) examination is scheduled for Monday, May 12, 2025 from 09:30 AM to 12:30 PM in Hall B-101 (Seat #B-34). Your hall ticket is verified and available for download.",
    category: "EXAM",
    dataCard: {
      title: "UTU End-Term Theory Schedule",
      metrics: [
        { label: "Date & Time", value: "May 12, 09:30 AM", color: "text-primary" },
        { label: "Hall & Seat", value: "Hall B-101 • B-34", color: "text-primary-container" },
        { label: "Admit Card", value: "Released & Verified", color: "text-status-success" },
      ],
      badgeText: "Exam Room Assigned",
      actionText: "Download Hall Ticket",
      actionUrl: "/student/exams",
    },
  },
  fees: {
    query: "What is my pending semester fee?",
    answer: "Great news! Your Semester 6 academic fees (Tuition ₹58,000, Examination ₹4,500, Hostel ₹38,000, and Bus ₹12,000) have been 100% paid and cleared. Zero balance outstanding.",
    category: "FEE",
    dataCard: {
      title: "Fee Clearance Ledger • AY 2024-25",
      metrics: [
        { label: "Total Paid", value: "₹1,12,500", color: "text-status-success" },
        { label: "Pending Dues", value: "₹0.00", color: "text-status-success" },
        { label: "No Dues Clearance", value: "Certified", color: "text-status-info" },
      ],
      badgeText: "Zero Dues Verified",
      actionText: "View Receipts Ledger",
      actionUrl: "/student/fees",
    },
  },
  syllabus: {
    query: "Summarize CS-602 Unit 3 notes",
    answer: "CS-602 Unit 3 covers Serverless Architecture & Cloud Storage: (1) Event-driven computing models vs containerized instances, (2) AWS Lambda lifecycle & execution cold starts, (3) Object storage consistency models (Amazon S3 bucket policies & ETags), (4) CAP Theorem tradeoffs in distributed dynamo architectures.",
    category: "SYLLABUS",
    dataCard: {
      title: "CS-602 Syllabus Quick Deck",
      metrics: [
        { label: "Course", value: "Cloud Computing", color: "text-primary" },
        { label: "Unit", value: "Unit 3 (Serverless)", color: "text-primary-container" },
        { label: "Slides & Notes", value: "4 Documents", color: "text-status-info" },
      ],
      badgeText: "Faculty Course Pack",
      actionText: "Open Study Repository",
      actionUrl: "/student/academics",
    },
  },
  hostel: {
    query: "How do I apply for Hostel Outpass?",
    answer: "To request a hostel outpass: (1) Go to Student Portal ➔ Hostel Module ➔ 'Apply Outpass', (2) Fill out your destination, departure time, and return date, (3) Enter your registered guardian contact for automated SMS verification, (4) Once Warden Mr. Surendra Rawat approves, your gate QR code is generated instantly.",
    category: "HOSTEL",
    dataCard: {
      title: "Digital Gate Outpass Protocol",
      metrics: [
        { label: "Hostel Block", value: "Himalayan B-204", color: "text-primary" },
        { label: "Lead Time", value: "6 Hours Min", color: "text-text-muted" },
        { label: "Approval Authority", value: "Chief Warden", color: "text-status-info" },
      ],
      badgeText: "Digital Pass",
      actionText: "Request Outpass Now",
      actionUrl: "/student/hostel",
    },
  },
};
