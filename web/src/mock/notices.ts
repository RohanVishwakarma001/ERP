import { CampusNotice } from "@/types";

export const MOCK_NOTICES: CampusNotice[] = [
  {
    id: "not-01",
    title: "Mid-Term Examinations Commencing May 12, 2025 — Download Hall Ticket",
    category: "EXAMINATION",
    publisher: "Office of the Controller of Examinations (COE)",
    date: "May 08, 2025",
    priority: "URGENT",
    summary: "All eligible students must download their cryptographic hall tickets before May 11, 2025. Students with attendance below 75% are withheld under UTU Ordinance 14(B).",
    isUnread: true,
  },
  {
    id: "not-02",
    title: "Microsoft & AWS Campus Drive Registrations Open for 2025 Batch",
    category: "PLACEMENT",
    publisher: "Training & Placement Cell (TPC)",
    date: "May 07, 2025",
    priority: "HIGH",
    summary: "Eligible B.Tech CSE, IT & ECE candidates with CGPA > 8.0 and zero active backlogs must submit their verified resumes via Career Vault.",
    isUnread: true,
  },
  {
    id: "not-03",
    title: "UTU Affiliation Compliance & Sessional Marks Portal Closure Notice",
    category: "ACADEMIC",
    publisher: "Dean Academics Office",
    date: "May 05, 2025",
    priority: "NORMAL",
    summary: "Faculty members are requested to complete internal mark locking and submit verified rubrics for laboratory courses by May 10.",
    isUnread: false,
  },
  {
    id: "not-04",
    title: "Hostel Outpass Digital QR Protocol for Semester Preparation Week",
    category: "HOSTEL",
    publisher: "Chief Hostel Warden",
    date: "May 04, 2025",
    priority: "NORMAL",
    summary: "Digital outpass requests must be submitted at least 6 hours in advance through the JBIT Mobile App. Parent consent verification is required.",
    isUnread: false,
  },
];
