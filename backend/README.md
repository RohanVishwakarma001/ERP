# JBIT Campus ERP — Enterprise Backend API
> **JB Institute of Technology, Dehradun (Affiliated to UTU / SDSUV / UBTER, Approved by AICTE)**

---

## 1. Project Overview

The **JBIT Campus ERP Backend** is a production-grade, multi-tenant academic and institutional enterprise API built using **NestJS 11**, **TypeScript**, **PostgreSQL**, **Prisma ORM**, and **Socket.io**. It provides high-performance, strictly typed REST and WebSocket services for:

1. **Enterprise Web ERP** (`/web` - Next.js App Router for Admin, HOD, Finance, COE, TPO, Library, Hostel, Transport, Faculty, Student)
2. **Student Mobile Application** (`/mobile` - React Native & Expo 57 for Android & iOS)
3. **Faculty Mobile Hub** (`/mobile` - React Native & Expo 57 for Android & iOS)

---

## 2. Core Technology Stack

- **Framework:** NestJS 11 (Modular Architecture with Dependency Injection)
- **Language:** TypeScript 5.7+ (Strict Mode)
- **Database & ORM:** PostgreSQL 16+ via Prisma ORM 6.4
- **Real-Time WebSockets:** `@nestjs/websockets` & `socket.io` (Classroom QR rotation, telematics, notifications)
- **Queue & Background Jobs:** BullMQ with Redis
- **Security & RBAC:** Passport JWT, BcryptJS, RolesGuard, PermissionsGuard
- **API Documentation:** Swagger / OpenAPI at `/api/docs`
- **Validation:** Class-Validator & Class-Transformer (Strict DTO Whitelist)
- **Testing:** Jest & Supertest (Unit & Integration)

---

## 3. Architecture Blueprint

```text
backend/
├── src/
│   ├── main.ts                    # Bootstrap with global prefix (/api/v1), CORS, filters, interceptors & Swagger
│   ├── app.module.ts              # Root aggregation of 24 domain modules
│   │
│   ├── common/                    # Enterprise cross-cutting concerns
│   │   ├── decorators/            # @Public(), @Roles(), @Permissions(), @CurrentUser()
│   │   ├── guards/                # JwtAuthGuard, RolesGuard, PermissionsGuard
│   │   ├── filters/               # GlobalHttpExceptionFilter (Uniform { success, error } envelope)
│   │   └── interceptors/          # TransformInterceptor ({ success, data, message }), LoggingInterceptor
│   │
│   ├── prisma/                    # PrismaService & global PrismaModule
│   ├── websocket/                 # EventsGateway (Socket.io)
│   │
│   ├── auth/                      # SSO, JWT access/refresh rotation, 6-digit OTP verification
│   ├── students/                  # Academic dossiers, KYC, UTU Ordinance 14(B) debarment
│   ├── faculty/                   # Faculty directory, 18-hour AICTE workload compliance
│   ├── departments/               # Department budgets, NBA accreditation, courses & curriculum
│   ├── timetable/                 # Timetable engine with automated clash/conflict detection
│   ├── attendance/                # Geofenced rotating QR attendance, bulk roster marking, 75% UTU math
│   ├── examinations/              # Seating matrix generator, mark locking, SGPA/CGPA calculation engine
│   ├── assignments/               # Assignments, deadlines, submission evaluations
│   ├── materials/                 # Course materials & lecture notes
│   ├── fees/                      # Fee ledger, Razorpay order creation, webhooks, and receipts
│   ├── notices/                   # Institutional circulars & official gazettes
│   ├── notifications/             # Centralized push & in-app notification center
│   ├── leave/                     # Leave requests & duty leave approval workflow
│   ├── complaints/                # Grievance ticketing (OPEN, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED)
│   ├── documents/                 # KYC documents & DigiLocker certificate generator with public QR verification
│   ├── library/                   # RFID inventory, checkout, returns, and overdue fine ledger
│   ├── placement/                 # Recruitment drives, CGPA eligibility verification, digital LOI signing
│   ├── hostel/                    # Bed allocations, Shivalik/Alaknanda occupancy, digital outpass
│   ├── transport/                 # Bus Route 12 telematics, GPS tracking, and bus passes
│   ├── analytics/                 # Executive dashboards for Super Admin, HOD, and Finance
│   ├── ai/                        # Grounded JBIT Campus Copilot with controlled, authenticated tools
│   ├── audit/                     # Immutable audit trail
│   ├── events/                    # Hackathons, cultural fests, club registrations
│   ├── feedback/                  # IQAC feedback on courses and infrastructure
│   └── health/                    # Health check endpoint (/api/v1/health)
│
├── prisma/
│   ├── schema.prisma              # 40+ normalized relational entities
│   └── seed.ts                    # Institutional seed script for JBIT Dehradun
│
├── Dockerfile                     # Multi-stage production container
├── package.json                   # Scripts and dependencies
├── tsconfig.json                  # Strict decorator metadata configuration
└── .env.example                   # Environment configuration template
```

---

## 4. Environment Variables (`.env`)

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Key | Example Value | Description |
|---|---|---|
| `PORT` | `8000` | Backend listening port |
| `NODE_ENV` | `development` | Runtime environment (`development` / `production`) |
| `WEB_URL` | `http://localhost:3000` | Allowed frontend origin for CORS |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/jbit_campus_erp?schema=public` | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection for queues and caching |
| `JWT_ACCESS_SECRET` | `jbit_super_secure_access_secret_token_2026_utu_node` | 15-minute access token secret |
| `JWT_REFRESH_SECRET` | `jbit_super_secure_refresh_secret_token_2026_utu_node` | 7-day refresh token secret |
| `PAYMENT_KEY_ID` | `rzp_test_mock_jbit_2026` | Razorpay gateway API key |
| `PAYMENT_WEBHOOK_SECRET` | `rzp_wh_mock_jbit_2026` | Webhook verification secret |

---

## 5. Development & Running Commands

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma Client
npx prisma generate

# 3. Run database migrations (when PostgreSQL is active)
npm run prisma:migrate

# 4. Seed development database
npm run prisma:seed

# 5. Typecheck TypeScript strict mode
npm run typecheck

# 6. Run unit and integration tests
npm test

# 7. Start in watch mode for development
npm run start:dev

# 8. Build production bundle
npm run build
npm run start:prod
```

---

## 6. API Documentation (Swagger OpenAPI)

When the server runs, interactive documentation with pre-configured request payloads and bearer authentication is accessible at:

**`http://localhost:8000/api/docs`**

---

## 7. Authentication & RBAC

The API enforces strict multi-role authentication. 10 institutional roles are supported:

| Role | Default Demo Identifier | Password | Access Capabilities |
|---|---|---|---|
| `SUPER_ADMIN` / `ADMIN` | `registrar@jbitdoon.edu.in` | `Jbit@2026` | Universal institutional administration |
| `HOD` | `hod.cse@jbitdoon.edu.in` | `Jbit@2026` | Department oversight, faculty load, leave approval |
| `FACULTY` | `FAC-CSE-001` | `Jbit@2026` | Classes, rotating QR generation, marks entry |
| `STUDENT` | `220102048` | `Jbit@2026` | Attendance, QR scanner, grade cards, fee ledger |
| `ACCOUNTANT` | `finance@jbitdoon.edu.in` | `Jbit@2026` | Fee structure, payment reconciliation, receipts |
| `EXAM_OFFICER` | `coe@jbitdoon.edu.in` | `Jbit@2026` | Seating matrix, mark locking, result publishing |
| `PLACEMENT_OFFICER` | `tpo@jbitdoon.edu.in` | `Jbit@2026` | Recruiter scoring, drive eligibility, LOI signing |
| `HOSTEL_WARDEN` | `warden@jbitdoon.edu.in` | `Jbit@2026` | Bed allocations, outpass approvals |
| `TRANSPORT_MANAGER` | `transport@jbitdoon.edu.in` | `Jbit@2026` | Fleet GPS tracking, Route 12 passes |
| `LIBRARIAN` | `library@jbitdoon.edu.in` | `Jbit@2026` | RFID book checkouts, inventory, overdue fines |

---

## 8. Critical Mathematical & Business Rules Implemented

1. **Statutory 75% UTU Attendance Rule (Ordinance 14-B):**
   - Automatically calculates shortfall: `needed = Math.ceil((0.75 * total - attended) / 0.25)`.
   - Debarment flag triggers when `overallPercentage < 75.0%`.
2. **Rotating Cryptographic QR Attendance:**
   - 60-second token lifetime.
   - GPS Haversine distance geofence validation (distance <= 35m).
   - Duplicate submission protection per session.
3. **UTU Credit-Weighted SGPA Formula:**
   - `SGPA = Σ (Credit * GradePoint) / Σ (Credits)`.
   - Grade mapping: O (10), A+ (9), A (8), B+ (7), B (6), C (5), F (0).
4. **Seating Matrix Anti-Cheating Engine:**
   - Automatically alternates desks between adjacent branches and sections.
5. **Digital Certificates with Public QR Verification:**
   - `GET /api/v1/documents/certificates/verify/:code` allows instant verification by employers or banks without exposing sensitive student personal data.

---

## 9. Production Deployment

### Docker Container
```bash
docker build -t jbit-campus-erp-backend .
docker run -p 8000:8000 --env-file .env jbit-campus-erp-backend
```

Compatible with **Render**, **Railway**, **AWS ECS/Fargate**, **Azure App Service**, or any standard Node 24+ environment.
