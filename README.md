# JBIT Dehradun — Campus ERP Ecosystem
### Enterprise Academic & Institutional Operating System
> **JB Institute of Technology, Dehradun (Affiliated to UTU / SDSUV / UBTER, Approved by AICTE)**

---

## 1. Project Overview

The **JBIT Campus ERP Ecosystem** is a production-grade, multi-tenant academic and institutional enterprise management suite built directly from the high-fidelity **Stitch UI/UX designs**. It translates 29 verified enterprise screens into a responsive **Next.js Web ERP** and an **Expo / React Native Mobile App (Android & iOS)** with centralized API abstractions, type-safe models, and realistic academic data matching Uttarakhand Technical University (UTU) norms.

```text
stitch_jbit_campus_erp_ecosystem/
│
├── web/        → Next.js 16 (App Router) Enterprise Web ERP
├── mobile/     → React Native / Expo 57 Cross-Platform Mobile ERP (Android & iOS)
├── backend/    → Complete NestJS 11 + PostgreSQL + Prisma + Socket.io Enterprise Backend API
├── ERP/        → Source of Truth Stitch UI/UX Designs & Design System Tokens
└── README.md   → Ecosystem Documentation & Architecture Blueprint
```

---

## 2. Institutional Design System & Visual Identity

The design system strictly adheres to `ERP/academic_enterprise_linear/DESIGN.md`:

| Token | Hex Code | Visual Application |
|---|---|---|
| **Institutional Navy (`primary`)** | `#002541` | Top institutional headers, brand badges, executive KPI hero cards |
| **Deep Cobalt (`primary-container`)** | `#0B3B60` | Primary buttons, active sidebars, modal headers, navigation pills |
| **Sky Tint (`primary-light`)** | `#E8F1F8` | Table headers, icon badges, secondary highlight boxes |
| **Academic Brick (`secondary`)** | `#BB0112` | Debarment warnings, critical notices, badge accents, emergency notices |
| **Success Emerald (`success`)** | `#10B981` | Safe statutory attendance (>75%), pass grades, verified DigiLocker credentials |
| **Amber Warning (`warning`)** | `#F59E0B` | Low attendance warnings (<75%), pending fees, unreviewed petitions |
| **Slate Canvas (`background`)** | `#F8FAFC` | Institutional dashboard background canvas, data cards |

- **Primary Typography:** `Plus Jakarta Sans` (Institutional headings & hero metrics) + `Inter` (High-density tabular UI).
- **Tabular Data Numerics:** `font-variant-numeric: tabular-nums` for roll numbers, SGPA/CGPA, timestamps, and rupee ledgers.

---

## 3. Role-Based Access Control (RBAC) Architecture

The ERP frontend strictly isolates features by user role with frontend route guards (`web/src/lib/route-guards.ts`, `permissions.ts`, and `roles.ts`). If an unauthorized URL is requested, a dedicated institutional **403 Forbidden** page is displayed.

| Role Code | Institutional User Role | Web Access Path | Mobile Experience |
|---|---|---|---|
| `ADMIN` | Super Admin / Registrar | `/admin/*` (All 20+ modules) | Administrator oversight |
| `HOD` | Head of Department (Dr. V. K. Bhatt) | `/hod/dashboard` | Faculty Console & Department Roster |
| `ACCOUNTANT` | Finance & Accounts Officer | `/finance/dashboard`, `/admin/fees` | Fee payment status & receipts |
| `EXAM_OFFICER` | Controller of Examinations (COE) | `/exam/dashboard`, `/admin/exams` | Seating matrix & grade publishing |
| `LIBRARIAN` | Central Library Head | `/library/dashboard`, `/admin/library` | RFID catalog & book checkout |
| `PLACEMENT_OFFICER` | Training & Placement Head (TPO) | `/placement/dashboard`, `/admin/placement` | Recruiter console & LOI tracking |
| `HOSTEL_WARDEN` | Chief Hostel Warden | `/hostel/dashboard`, `/admin/hostel` | Shivalik/Alaknanda bed allotment |
| `TRANSPORT_MANAGER` | Fleet & Transport Officer | `/transport/dashboard`, `/admin/transport` | Route 12 GPS telematics & passes |
| `FACULTY` | Professor / Assistant Professor | `/faculty/dashboard` | 5 Bottom Tabs: Console, Roster, Marks, Timetable, More |
| `STUDENT` | Undergrad / Postgrad Student | `/student/dashboard`, `/student/attendance` | 5 Bottom Tabs: Home, Academics, Attendance, Schedule, More |

> **Note on Constraints:** As explicitly commanded, **no Parent Login** has been implemented.

---

## 4. Web Application (`/web`)

Built with **Next.js 16.3.6 (Turbopack)**, React 19, TypeScript strict mode, Tailwind CSS v4, Lucide React, and TanStack Query.

### Key Web Features & Implemented Routes

1. **Authentication & SSO Gateway (`/login`, `/otp`):**
   - Institutional 10-Role Demo Switcher (Instant 1-click login into any institutional role).
   - Roll number / Faculty ID login with 6-digit OTP verification.
2. **Access Denied Security Guard (`/403`):**
   - Displays denied role information and direct links to allowed dashboards.
3. **Super Admin Suite (`/admin/*`):**
   - `/admin/dashboard`: Himalayan morning greeting, UTU Cloud Node telematics, live registration metrics, quick shortcuts.
   - `/admin/departments`: Department directory, NBA accreditation, AICTE sanctioned intake, budget utilization.
   - `/admin/students`: Complete student roster, 75% UTU attendance debarment gauge, filter by debarred/safe/probation, batch export.
   - `/admin/timetable`: AI-assisted timetable conflict matrix, lab and classroom allocation, faculty workload balance.
   - `/admin/exams`: Seating arrangement matrix, invigilator assignments, admit card generator, hall tickets.
   - `/admin/placement`: Corporate relations dashboard, CTC distributions, drives pipeline, partner companies.
   - `/admin/recruiter`: Candidate scoring matrix, interview rounds, instant LOI generation & digital acceptance.
   - `/admin/faculty`: Faculty directory, 18-hour AICTE workload compliance tracker, designations, qualifications.
   - `/admin/courses`: Academic programs (B.Tech, M.Tech, BCA, MCA, Diploma), intake quotas, AICTE norms.
   - `/admin/fees`: Fee structure configuration, semester collections, defaulters report, payment receipts.
   - `/admin/library`: RFID book catalog, issued inventory, overdue fine tracking, digital library links.
   - `/admin/hostel`: Shivalik & Alaknanda hostels, floor-wise room matrix, bed allocation, outpass ledger.
   - `/admin/transport`: Fleet tracking, Route 12 (Clock Tower → Prem Nagar → JBIT Campus), bus pass ledger.
   - `/admin/notices`: Circular & gazette publisher, urgent notice alerts, category tagging.
   - `/admin/complaints`: Grievance & redressal ticketing, assignment, resolution tracking, SLA status.
   - `/admin/ai-copilot`: Campus AI Copilot console with context prompts and grounded student analytics.
4. **HOD Academic Suite (`/hod/dashboard`):**
   - Department workload, faculty leave review, low attendance alerts, UTU result analysis.
5. **Finance Suite (`/finance/dashboard`):**
   - Daily cash collection, online payment gateway reconciliation, refund requests, fee defaulters.
6. **Examination Suite (`/exam/dashboard`):**
   - Examination schedules, seating layout generator, marks moderation, results publishing.
7. **Placement Suite (`/placement/dashboard`):**
   - Company registration, eligibility shortlisting, interview round schedules, offer letters.
8. **Student Web Dashboard (`/student/dashboard`, `/student/attendance`):**
   - Himalayan hero, live CGPA (8.92), overall attendance (84.5%), classroom QR attendance scanner with geofence validation, and attendance correction petitions.
9. **Faculty Web Dashboard (`/faculty/dashboard`):**
   - Dr. V. K. Bhatt Academic Hub, active Period 2 banner, live rotating QR attendance modal with countdown, student roster grading.

---

## 5. Mobile Application (`/mobile`)

Built with **React Native 0.86**, **Expo 57**, TypeScript, Zustand, and TanStack Query. Supports both **Android** and **iOS** from a single shared codebase.

### Mobile Navigation & Screen Architecture

The app uses a persistent bottom navigation bar tailored to the authenticated role, with a universal institutional top bar allowing **1-tap switching between Student and Faculty modes**.

#### Student Mobile Experience
- **Home Tab:** Himalayan greeting, Live CGPA & Attendance summary cards, Express Action grid (Scan QR, DigiLocker Grade Card, Copilot, Attendance), Today's Live Class Schedule timeline, Campus Transit Bus 12 telematics widget, Urgent official notices.
- **Academics Tab:** Semester VI syllabus progress by course, DigiLocker verified grade cards (Sem 1 to Sem 5 with SGPA 8.65 to 9.12), assignment deadlines with file upload action.
- **Attendance Tab:** Statutory 75% UTU progress gauge, subject-by-subject attendance roster with classes needed for 75%, and attendance correction petitions.
- **Schedule Tab:** Weekly interactive timetable matrix with day selector (Mon–Fri), live period indicator, room numbers (LH-302, Turing Lab), and faculty names.
- **More Tab:** Campus placement drives (Adobe, TCS, Cognizant with eligibility), hostel outpass request, fee receipts, AI Copilot, settings, and role switcher.

#### Faculty Mobile Experience
- **Console Tab:** Dr. V. K. Bhatt Academic Hub, 18-hour AICTE compliance score (100%), Period 2 live banner with 1-tap QR broadcast trigger, today's teaching load.
- **Attendance Tab:** Class & Period selector (`CSE-8B`, `CSE-6A`, `CSE-4A`), Present / Absent / Late interactive student roster, "All Present" bulk action, and dynamic rotating QR broadcaster modal with 60s countdown and real-time student scan tally.
- **Marks Tab:** Continuous Internal Assessment (CIA-1, CIA-2) and practical lab evaluation score entry with direct submission to COE.
- **Schedule Tab:** Weekly teaching load, contact hours, and AICTE compliance stats.
- **More Tab:** Faculty leave applications, student petitions review, Copilot, and logout.

#### Interactive Modals
- **QR Scanner Modal:** Laser scanning animation, reticle corner markers, campus Wi-Fi BSSID and geofence check, and instant verification response.
- **QR Broadcaster Modal:** Dynamic rotating QR token, 60s live countdown timer, auto-refresh, and live student counter (`38/54 Students`).
- **AI Campus Copilot Modal:** Conversational chat interface grounded in academic records with pre-configured quick prompts.

---

## 6. Centralized API & Mock Architecture

Both Web and Mobile applications route 100% of data requests through a centralized service abstraction layer. **No UI component ever calls `fetch()` or `axios` directly.**

```text
web/src/services/
├── api-client.ts        → Axios client with auth interceptors & baseURL config
├── auth.service.ts      → Authentication, tokens, role switching, user profiles
└── domain-services.ts   → studentService, facultyService, attendanceService,
                           timetableService, examService, placementService,
                           feeService, noticeService, complaintService, etc.

mobile/src/services/
├── api-client.ts        → Mobile Axios instance with SecureStore token interceptor
└── mobile-services.ts   → mobileStudentService, mobileFacultyService,
                           mobileNoticeService, mobilePlacementService
```

### Switching to Real Backend
All services contain a feature flag:
```typescript
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true"; // or EXPO_PUBLIC_USE_MOCK
```
When the backend API is ready:
1. Update `NEXT_PUBLIC_API_URL` / `EXPO_PUBLIC_API_URL` to your backend host.
2. Set `USE_MOCK=false`.
3. The UI components will seamlessly consume real backend data with zero refactoring.

---

## 7. Environment Variables

### Web (`web/.env.local`)
```env
NEXT_PUBLIC_API_URL=https://api.jbitdoon.edu.in/api/v1
NEXT_PUBLIC_APP_NAME="JBIT Dehradun Campus ERP"
NEXT_PUBLIC_CAMPUS="Dehradun Campus"
NEXT_PUBLIC_USE_MOCK=true
```

### Mobile (`mobile/.env`)
```env
EXPO_PUBLIC_API_URL=https://api.jbitdoon.edu.in/api/v1
EXPO_PUBLIC_APP_NAME="JBIT Campus ERP"
EXPO_PUBLIC_CAMPUS="Dehradun Campus"
EXPO_PUBLIC_USE_MOCK=true
```

---

## 8. Getting Started & Running Locally

### Prerequisites
- Node.js >= 20.x
- npm >= 10.x

### Web Application Setup
```bash
# 1. Navigate to web directory
cd web

# 2. Install dependencies (already installed)
npm install

# 3. Run typecheck to verify TypeScript
npm run typecheck

# 4. Run development server
npm run dev

# 5. Or build production bundle (Static + Turbopack)
npm run build
npm run start
```
The web dashboard runs at `http://localhost:3000`.

### Mobile Application Setup
```bash
# 1. Navigate to mobile directory
cd mobile

# 2. Install dependencies (already installed)
npm install

# 3. Verify Expo environment
npx expo-doctor

# 4. Run TypeScript check
npm run typecheck

# 5. Start Expo dev server
npm run start

# Run on Android emulator / device:
npm run android

# Run on iOS simulator / device:
npm run ios

# Run in mobile web mode:
npm run web
```

### Backend API Setup
```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies (already installed)
npm install

# 3. Generate Prisma Client
npx prisma generate

# 4. Typecheck TypeScript strict mode
npm run typecheck

# 5. Run automated unit & integration tests
npm test

# 6. Start development server in watch mode
npm run start:dev

# 7. Production build & start
npm run build
npm run start:prod
```
The backend runs at `http://localhost:8000` with Swagger documentation at `http://localhost:8000/api/docs`.

---

## 9. Verification & Build Quality

All checks across **Web**, **Mobile**, and **Backend** pass with zero errors:

| Check | Target | Command | Result |
|---|---|---|---|
| **Web Build** | Next.js 16.3.6 (Turbopack) | `npm run build` | **Exit code 0** (32 static routes prerendered) |
| **Web Types** | TypeScript Strict | `npm run typecheck` | **Exit code 0** (0 type errors) |
| **Mobile Types** | TypeScript Strict | `npm run typecheck` | **Exit code 0** (0 type errors) |
| **Expo Health** | Expo Doctor | `npx expo-doctor` | **21/21 checks passed** (No issues detected) |
| **Backend Types** | TypeScript Strict | `npm run typecheck` | **Exit code 0** (0 type errors) |
| **Backend Tests** | Jest (15 Unit/Integration Tests) | `npm test` | **Exit code 0** (15/15 passed) |
| **Backend Build** | NestJS 11 Production Build | `npm run build` | **Exit code 0** (`dist/src/main.js` ready) |

---

## 10. Complete Production Backend (`/backend`)

The `/backend` folder contains the complete, production-grade NestJS 11 backend featuring:
- PostgreSQL database schemas with 40+ normalized relational entities in `prisma/schema.prisma`.
- JWT authentication with refresh token rotation and 10 institutional roles.
- WebSockets for dynamic rotating QR attendance (60s validity) and campus bus telematics.
- Mathematical 75% UTU statutory attendance calculations (Ordinance 14-B).
- Seating matrix anti-cheating engine and SGPA/CGPA credit processing.
- Payment order creation, webhook verification, and digital receipt generation.
- DigiLocker NAD verified certificate generation with public QR verification endpoint.
- Grounded JBIT Campus Copilot AI assistant with authenticated tool calling.

---

© 2026 JB Institute of Technology, Dehradun. Designed and engineered for institutional excellence.
