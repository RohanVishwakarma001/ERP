import { UserRole } from "@/types";

export interface RoleConfig {
  label: string;
  description: string;
  defaultPath: string;
  allowedPrefixes: string[];
  badgeColor: string;
}

/** Roles with unrestricted access to every area of the web app. */
export const ADMIN_ROLES: readonly UserRole[] = ["SUPER_ADMIN", "ADMIN"];

export function isAdminRole(role: UserRole | undefined): boolean {
  return role !== undefined && ADMIN_ROLES.includes(role);
}

export const ROLES_CONFIG: Record<UserRole, RoleConfig> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    description: "Unrestricted system administration",
    defaultPath: "/admin/dashboard",
    allowedPrefixes: ["/"],
    badgeColor: "bg-primary text-on-primary",
  },
  ADMIN: {
    label: "Administrator / Dean",
    description: "Full institutional governance, departments, timetable, exams, placement & settings",
    defaultPath: "/admin/dashboard",
    allowedPrefixes: ["/admin"],
    badgeColor: "bg-primary-container text-on-primary",
  },
  HOD: {
    label: "Head of Department",
    description: "Departmental workload, faculty reviews, academic metrics & compliance",
    defaultPath: "/hod/dashboard",
    allowedPrefixes: ["/hod", "/admin/departments", "/admin/courses", "/admin/faculty", "/faculty/assignments"],
    badgeColor: "bg-tertiary-container text-on-tertiary",
  },
  ACCOUNTANT: {
    label: "Finance & Accounts Officer",
    description: "Fee structures, fee ledger, collections, receipts, challans & refunds",
    defaultPath: "/finance/dashboard",
    allowedPrefixes: ["/finance", "/admin/fees"],
    badgeColor: "bg-emerald-800 text-white",
  },
  EXAM_OFFICER: {
    label: "Controller of Examinations (COE)",
    description: "UTU examination cycles, hall seating matrix & cryptographic mark locking",
    defaultPath: "/exam/dashboard",
    allowedPrefixes: ["/exam", "/admin/exams"],
    badgeColor: "bg-indigo-900 text-white",
  },
  LIBRARIAN: {
    label: "Head Librarian",
    description: "Library catalog, RFID circulation, book reservations & overdue fines",
    defaultPath: "/library/dashboard",
    allowedPrefixes: ["/library", "/admin/library"],
    badgeColor: "bg-amber-800 text-white",
  },
  PLACEMENT_OFFICER: {
    label: "Training & Placement Officer (TPO)",
    description: "Corporate relations, campus drives, recruiter scoring, LOI & NIRF metrics",
    defaultPath: "/placement/dashboard",
    allowedPrefixes: ["/placement", "/admin/placement"],
    badgeColor: "bg-cyan-900 text-white",
  },
  HOSTEL_WARDEN: {
    label: "Chief Hostel Warden",
    description: "Hostel building blocks, bed allocations, outpass approvals & disciplinary logs",
    defaultPath: "/hostel/dashboard",
    allowedPrefixes: ["/hostel", "/admin/hostel"],
    badgeColor: "bg-violet-900 text-white",
  },
  TRANSPORT_MANAGER: {
    label: "Fleet & Transport Manager",
    description: "Bus fleet, GPS tracking, routes, drivers, and campus transport passes",
    defaultPath: "/transport/dashboard",
    allowedPrefixes: ["/transport", "/admin/transport"],
    badgeColor: "bg-teal-900 text-white",
  },
  FACULTY: {
    label: "Faculty / Professor",
    description: "Class lectures, attendance registry, lab assignments & internal marks",
    defaultPath: "/faculty/dashboard",
    allowedPrefixes: ["/faculty"],
    badgeColor: "bg-blue-900 text-white",
  },
  STUDENT: {
    label: "Undergraduate / Postgraduate Student",
    description: "Personal academic record, QR attendance, grade card, fees, placement & AI copilot",
    defaultPath: "/student/dashboard",
    allowedPrefixes: ["/student"],
    badgeColor: "bg-slate-800 text-white",
  },
};
