import type { ReactNode } from "react";
import {
  Award,
  Bed,
  BellRing,
  BookOpen,
  Bot,
  Briefcase,
  Building2,
  Bus,
  CalendarCheck2,
  CalendarDays,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  Users2,
  Wallet,
} from "lucide-react";
import type { UserRole } from "@/types";
import { ROLES_CONFIG, isAdminRole } from "@/lib/auth/roles";

export interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  badge?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

const icon = (Icon: typeof LayoutDashboard) => <Icon className="w-[18px] h-[18px]" />;

// Every href must be a page that exists, and must be reachable by the role that
// sees it (lib/auth/roles.ts `allowedPrefixes`), or the proxy will redirect away.
const ITEMS = {
  departments: { label: "Departments", href: "/admin/departments", icon: icon(Building2) },
  courses: { label: "Programs & Courses", href: "/admin/courses", icon: icon(GraduationCap) },
  faculty: { label: "Faculty Workload", href: "/admin/faculty", icon: icon(Users2) },
  students: { label: "Student Roster", href: "/admin/students", icon: icon(Users2) },
  placement: { label: "Placement Drives", href: "/admin/placement", icon: icon(Briefcase) },
  recruiter: { label: "Offers & LOI", href: "/admin/recruiter", icon: icon(Award) },
  timetable: { label: "Timetable", href: "/admin/timetable", icon: icon(CalendarDays) },
  exams: { label: "Exam Seating & COE", href: "/admin/exams", icon: icon(CalendarCheck2) },
  fees: { label: "Fee Ledger", href: "/admin/fees", icon: icon(Wallet) },
  library: { label: "Central Library", href: "/admin/library", icon: icon(BookOpen) },
  hostel: { label: "Hostels", href: "/admin/hostel", icon: icon(Bed) },
  transport: { label: "Fleet & Transport", href: "/admin/transport", icon: icon(Bus) },
  notices: { label: "Campus Notices", href: "/admin/notices", icon: icon(BellRing) },
  complaints: { label: "Grievances", href: "/admin/complaints", icon: icon(HelpCircle) },
  copilot: { label: "AI Campus Copilot", href: "/admin/ai-copilot", icon: icon(Bot), badge: "AI" },
} satisfies Record<string, NavItem>;

const ADMIN_NAV: NavSection[] = [
  { title: "Main", items: [{ label: "Overview", href: "/admin/dashboard", icon: icon(LayoutDashboard) }] },
  {
    title: "Academic Affairs",
    items: [ITEMS.departments, ITEMS.courses, ITEMS.faculty, ITEMS.students, ITEMS.placement, ITEMS.recruiter],
  },
  { title: "Scheduling & Exams", items: [ITEMS.timetable, ITEMS.exams] },
  {
    title: "Campus Operations",
    items: [ITEMS.fees, ITEMS.library, ITEMS.hostel, ITEMS.transport, ITEMS.notices, ITEMS.complaints],
  },
  { title: "System & AI", items: [ITEMS.copilot] },
];

/** Extra links for non-admin roles, beyond their own dashboard. */
const ROLE_EXTRAS: Partial<Record<UserRole, NavItem[]>> = {
  HOD: [ITEMS.departments, ITEMS.faculty],
  ACCOUNTANT: [ITEMS.fees],
  EXAM_OFFICER: [ITEMS.exams],
  LIBRARIAN: [ITEMS.library],
  PLACEMENT_OFFICER: [ITEMS.placement],
  HOSTEL_WARDEN: [ITEMS.hostel],
  TRANSPORT_MANAGER: [ITEMS.transport],
  STUDENT: [
    { label: "Attendance", href: "/student/attendance", icon: icon(CalendarCheck2) },
    { label: "Fee Ledger", href: "/student/fees", icon: icon(Wallet) },
  ],
};

export function navigationFor(role: UserRole): NavSection[] {
  if (isAdminRole(role)) return ADMIN_NAV;
  const main: NavSection = {
    title: "Main",
    items: [{ label: "Overview", href: ROLES_CONFIG[role].defaultPath, icon: icon(LayoutDashboard) }],
  };
  const extras = ROLE_EXTRAS[role];
  return extras ? [main, { title: "Access", items: extras }] : [main];
}
