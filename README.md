# City General Hospital Management System

<div align="center">

![React](https://img.shields.io/badge/React-19.1-61DAFB?style=flat-square&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)
![Express](https://img.shields.io/badge/Express-5.1-000000?style=flat-square&logo=express)
![MySQL](https://img.shields.io/badge/MySQL-5.7+-4479A1?style=flat-square&logo=mysql&logoColor=white)
![Material UI](https://img.shields.io/badge/Material_UI-7.1-007FFF?style=flat-square&logo=mui)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens)
![Razorpay](https://img.shields.io/badge/Razorpay-Payments-02042B?style=flat-square&logo=razorpay)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

**A full-stack Hospital Management System covering the complete patient journey — from registration and appointment booking through lab tests, prescriptions, inpatient care, billing, and discharge — with multi-role access control and real-time queue management.**

[Features](#key-features) · [Architecture](#architecture-overview) · [Tech Stack](#tech-stack) · [Installation](#installation) · [API Reference](#api-overview)

</div>

---

## Project at a Glance

| Metric | Count |
|---|---|
| Backend route modules | 50+ |
| REST API endpoints | 70+ |
| Database tables | 30+ |
| Database views | 3 |
| Frontend page components | 40+ |
| RBAC menu items | 50+ |
| Dashboard analytics charts | 8 |
| Tabular reports | 5 |

Built entirely from scratch — no admin template, no boilerplate backend. Every query is hand-written SQL, every UI component is built on MUI primitives.

---

## Table of Contents

- [Key Features](#key-features)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Authentication & Security](#authentication--security)
- [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
- [Patient Self-Service Chat Assistant](#patient-self-service-chat-assistant)
- [Database Design](#database-design)
- [API Overview](#api-overview)
- [Folder Structure](#folder-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [Security Features](#security-features)
- [Future Enhancements](#future-enhancements)

---

## Key Features

### Authentication & User Management
- **Two-Factor Login** — password verified via bcrypt → 6-digit OTP sent via Gmail → JWT issued only after OTP verification
- **Account Lockout** — 3 consecutive failed attempts trigger a 60-second lockout, enforced at the database row level
- **JWT Sessions** — 24-hour signed tokens embed `isSuperAdmin`, `roles[]`, and user identity; verified on every protected route
- **Password Management** — bcrypt with 10 salt rounds; minimum length enforced; self-service change flow
- **Session Audit Trail** — every login and logout recorded with IP address, user agent, session UUID, timestamp, and failure reason

### Role & Permission Management
- **Fully Database-Driven RBAC** — roles, menus, and mappings live in the database; no hard-coded permission lists
- **Menu-Level Permissions** — assign any subset of 50+ menu items to any role via a checkbox tree UI
- **Multi-Role Users** — a user holding multiple roles receives the union of all permitted menus
- **isSuperAdmin Auto-Detection** — at login, the system checks whether a user's combined roles cover 100% of active menus; if yes, all permission checks are bypassed
- **User-Role Mapping UI** — assign and revoke roles per user; changes take effect at next login

### Patient Management
- **Patient Registration** — full demographics capture (name, DOB, age auto-calculated, sex, address, city, PIN, email, phone, next of kin) with input validation
- **360° Patient Timeline** — chronological view across 11 event types: registrations, appointments, admissions, discharges, consultations, lab tests, prescriptions, pharmacy, services, payments, and documents — with summary counts
- **Patient Documents** — upload, preview, download, and soft-delete patient files (PDF, images, Word, up to 50 MB); per-category file-type and size restrictions enforced at upload

### Doctor Management
- **Doctor Directory** — all in-house and referral doctors with specialization, qualifications, and contact details
- **Doctor Availability** — per-doctor working days and slot duration configuration drives the appointment booking engine

### Appointment Scheduling
- **Slot-Based Booking** — a recursive CTE generates all theoretical slots for a doctor on a given date, subtracts already-booked slots, and excludes past times for today
- **Email Confirmations** — Nodemailer sends booking and cancellation confirmation emails to the patient's registered address

### Clinical Services
- **Inpatient Admission** — ward/room/bed assignment with availability check; bed status toggled atomically; registration status advances through `R → A → D` lifecycle
- **Lab Test Ordering & Results** — grid-based multi-test ordering per visit; results entry with reference range display by result type (range, less-than, greater-than, positive/negative)
- **Prescriptions** — per-line drug, dosage schedule, and food instruction management with add/update/delete of individual lines
- **Medical Certificates** — generate `SICK_LEAVE` or `FITNESS` certificates with auto-numbered IDs (`MC-YYYYMM-NNNN`); PDFKit streams inline or as a download attachment; soft-cancel with reason recorded

### Pharmacy & Services
- **Pharmacy Dispensing** — issue drugs from the drug master with quantity, unit price, and total; full audit diff stored
- **Patient Services** — assign billable services (procedures, scans, etc.) to a registration with doctor linkage and charges

### Billing & Payments
- **Consolidated Bill View** — database view (`v_patient_bill`) aggregates all charge categories: registration, admission, ward, doctor fees, tests, pharmacy, services
- **Cash & Online Payment** — record payments with discount and payment mode; Razorpay integration creates orders in INR paise and verifies payment signatures via HMAC
- **Daily Earnings** — revenue breakdown by category grouped by payment date

### Queue Management
- **Counter Configuration** — create queue counters with token prefix, linked doctor/department, and average consultation time
- **Token Issuance** — sequential tokens (prefix + 3-digit number); estimated wait time computed as active count × avg consult time; duplicate-token prevention per patient per doctor per day
- **Live Queue Board** — real-time queue filterable by counter, doctor, status, and date
- **Status Transitions** — `WAITING → CALLED → WITH_DOCTOR → COMPLETED` (or `SKIPPED / CANCELLED / NO_SHOW`) with automatic timestamps at each step
- **Public Display Endpoint** — unauthenticated endpoint for counter display screens; shows current token and next 4 in queue
- **Queue Analytics** — aggregate dashboard stats, full daily detail, doctor-wise summary, and per-patient wait/consult time breakdown

### Analytics & Reporting
- **8 Live Dashboard Charts** (all fetched in parallel on page load):
  - Top 5 Lab Tests by Count · Top 5 Lab Tests by Revenue
  - Top 5 Pharmacy Items by Revenue · Top Doctors by Total Revenue
  - Patient Gender Distribution · Admissions & Discharges by Date
  - Patients by City · Patients by Age Group (10-year buckets)
- **5 Tabular Reports** with date-range filters: State-Wise Patient, Doctor-Wise Collection, Department-Test-Doctor Fees, Department-Doctor Fees, Referral Doctor Summary
- **Excel Export** — all tabular reports export to `.xlsx` via the `xlsx` + `file-saver` libraries
- **Audit Master** — view every data-change log: table, record ID, old JSON, new JSON, timestamp, and user
- **Login Audit Report** — paginated login history with date-range and username filters

### Notifications
- **Live Notification Bell** — header bell with badge count; popover shows 7 real-time counters (today's appointments, new admissions, current inpatients, today's payments, today's lab tests, available beds, occupied beds) each linking to its module page

---

## Architecture Overview

```
┌──────────────────────────────────────────────────┐
│                  Browser (React 19)              │
│  React Router v7 · MUI v7 · Recharts             │
│  FullyProtectedRoute → MenuContext (RBAC tree)   │
│  authFetch() — injects Bearer JWT, handles 401   │
└────────────────────┬─────────────────────────────┘
                     │ HTTP  |  CORS whitelist
┌────────────────────▼─────────────────────────────┐
│          Express 5 Backend (Node.js 18+)          │
│  50+ route modules · authenticateJWT middleware   │
│  auditHelper (fire-and-forget audit inserts)      │
│  chatbotSession (in-memory Map + 15 min sweep)   │
└────────────────────┬─────────────────────────────┘
                     │ mysql2 callback API
┌────────────────────▼─────────────────────────────┐
│                  MySQL 5.7+                       │
│  30+ tables · 3 views · raw SQL (no ORM)          │
│  Auto-reconnect proxy · 4-min keep-alive ping     │
└──────────────────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────┐
│              External Services                    │
│  Gmail via Nodemailer — OTP + appointment emails  │
│  Razorpay — order creation + HMAC verification   │
└──────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend

| Technology | Version | Role |
|---|---|---|
| React | 19.1.0 | UI framework |
| React Router | 7.6.0 | Client-side routing with nested layouts |
| Material UI | 7.1.0 | Component library |
| MUI X DataGrid | 8.5.0 | Paginated data tables |
| Recharts | 2.15.3 | Analytics dashboard charts |
| @react-pdf/renderer | 4.3.0 | In-browser PDF generation |
| xlsx + file-saver | 0.18.5 / 2.0.5 | Excel export |
| date-fns | 4.1.0 | Date formatting and arithmetic |
| Lucide React | 0.511.0 | Icon set |

### Backend

| Technology | Version | Role |
|---|---|---|
| Node.js + Express | 5.1.0 | HTTP server and routing |
| mysql2 | 3.14.1 | MySQL driver (callback API) |
| jsonwebtoken | 9.0.2 | JWT signing and verification |
| bcryptjs | 3.0.2 | Password hashing |
| Nodemailer | 7.0.3 | Transactional email (OTP, appointments) |
| multer | 2.0.1 | Multipart file upload |
| Razorpay SDK | 2.9.6 | Payment gateway integration |
| PDFKit | 0.19.1 | Server-side PDF streaming |
| xlsx | 0.18.5 | Excel parsing for bulk import |
| dotenv | 16.5.0 | Environment variable management |
| cors | 2.8.5 | CORS with explicit origin whitelist |

### Database

- **MySQL 5.7+** — normalised relational schema; 30+ tables, 3 views, all queries in raw SQL (no ORM)

---

## Authentication & Security

### Login Flow

```
1. POST /login
   ├─ bcrypt.compare(password, stored_hash)
   ├─ Check account lockout (3 failures → 60s lock)
   ├─ Generate 6-digit OTP via crypto.randomInt
   ├─ Store OTP + expiry (5 min) in user row
   └─ Send OTP via Gmail (Nodemailer)

2. POST /verify-otp
   ├─ Match OTP + check expiry
   ├─ Clear OTP from database
   ├─ Generate UUID session ID → INSERT LOGIN_AUDIT
   ├─ Fetch user's active role IDs from urm_user_role_mapping
   ├─ Compute isSuperAdmin (role menu coverage vs total active menus)
   ├─ Sign 24h JWT: { id, user_name, isSuperAdmin, roles: [roleIds] }
   └─ Return { token, isSuperAdmin, audit_session_id }

3. All subsequent requests
   └─ authenticateJWT middleware: verify JWT → set req.user → next()
```

### JWT Payload

```json
{
  "id": 1,
  "user_name": "admin",
  "isSuperAdmin": true,
  "roles": ["R001", "R002"],
  "iat": 1751500000,
  "exp": 1751586400
}
```

### Frontend Auth Utilities

- **`authFetch()`** — wraps every API call; injects `Authorization: Bearer <token>`; on `401` clears localStorage and redirects to `/login`
- **`FullyProtectedRoute`** — extracts all `MENU_URL` values from the RBAC menu tree; blocks navigation to any path not in the permitted set

---

## Role-Based Access Control (RBAC)

A fully database-driven, menu-level permission system with no hard-coded role checks.

### Data Model

```
MENU_MASTER  (M001 … M050+)
        ↑ many-to-many via rmm_role_menu_mapping
ROLE_MASTER  (R001 … R00N)
        ↑ many-to-many via urm_user_role_mapping
user
```

### Permission Resolution (at Login)

1. Fetch all role IDs the user holds from `urm_user_role_mapping`
2. If union of role menus covers 100% of active menus → `isSuperAdmin = true` (JWT claim)
3. After login, `GET /api/users/me/menus` returns only the user's permitted menus (ancestors included for hierarchy rendering)
4. `FullyProtectedRoute` blocks any route not in the permitted menu URL set
5. Super-Admin-only endpoints (`/newuser`, role management) re-check `req.user.isSuperAdmin` server-side

### Menu Hierarchy (50+ items)

```
Security   → New User, User List, Role, Role Permission, User Role Mapping, Login Audit
Master     → Location, Lab Test, Pharmacy Items, Facility, Doctor, Document, Import
Patient    → New Patient, Patient List, Patient Documents, Patient Timeline
Clinical   → Registration, Admission, Appointments, Test, Results, Pharmacy,
             Patient Services, Prescriptions, Doctor Consultations, Medical Certificates
Billing    → View Bills, Payment
Reports    → 5 tabular sub-reports, Audit Master, Daily Earnings, Charts
Queue      → Queue Management
```

---

## Patient Self-Service Chat Assistant

An embedded chat widget on the **Login page** lets patients book, reschedule, view, and cancel appointments — without needing a staff login. Built as a deterministic **rule-based state machine** (no LLM dependency) for reliability and data privacy.

### Architecture

```
AppointmentChatbot (React, LoginPage)
    └── POST /api/chatbot/identify   — patient lookup by ID or phone
    └── Chatbot JWT (2h TTL, 15-min inactivity sweep in-memory store)
    └── POST /api/chatbot/message    — main conversation handler
    └── GET  /api/chatbot/doctors + /slots
    └── POST / PUT / DELETE /api/chatbot/appointments
```

### State Machine

```
IDLE ──book──────► BOOKING_DOCTOR → BOOKING_DATE → BOOKING_SLOT → BOOKING_CONFIRM
     ──reschedule► RESCHEDULE_SELECT → RESCHEDULE_DATE → RESCHEDULE_SLOT → RESCHEDULE_CONFIRM
     ──cancel─────► CANCEL_SELECT → CANCEL_CONFIRM
     ──upcoming───► (immediate response)
     ──history────► (immediate response)
```

### Natural Language Capabilities

- Date parsing: "today", "tomorrow", "next Monday", "3rd January 2026", `DD/MM/YYYY`, ISO dates
- Time period: "morning" (05–12), "afternoon" (12–17), "evening" (17–21)
- Intent detection via keyword regex
- Auto-suggests next available date if no slots exist on the requested day
- Transactional booking: double-checks slot availability inside a transaction to prevent race conditions

---

## Database Design

### Table Inventory (30+ tables)

| Domain | Tables |
|---|---|
| Users & Auth | `user`, `LOGIN_AUDIT` |
| RBAC | `ROLE_MASTER`, `MENU_MASTER`, `rmm_role_menu_mapping`, `urm_user_role_mapping` |
| Doctors | `doctor`, `doctor_specialization`, `doctor_availability` |
| Patients | `patient` |
| Appointments | `appointment` |
| Clinical | `registration`, `admission`, `doc_consultation` |
| Laboratory | `test`, `test_category`, `test_detail` |
| Pharmacy | `drug_master`, `medical_item` |
| Services & Billing | `service`, `patient_charge`, `payment` |
| Prescriptions | `prescription`, `prescription_detail` |
| Facility | `ward`, `ward_room`, `ward_room_bed` |
| Location | `country`, `state`, `city` |
| Queue | `TOKEN_COUNTER_MASTER`, `PATIENT_QUEUE` |
| Audit | `audit_log` |
| Documents | `DOCUMENT_MASTER`, `PATIENT_DOCUMENT` |
| Certificates | `MEDICAL_CERTIFICATE` |

### Views

| View | Purpose |
|---|---|
| `v_patient_bill` | Full bill line-item aggregation across all charge categories |
| `v_patient_bill_summary` | Totals per registration for billing summary screen |
| `v_referralDoc` | Referral doctor summary for reporting |

### Key Design Decisions

- **Bed lifecycle** — `ward_room_bed.bed_status` toggles `A ↔ O` atomically with admission/discharge transactions
- **Registration lifecycle** — `reg_status` advances `R → A → D` (registered → admitted → discharged)
- **Audit diffs** — every mutation writes `old_data` and `new_data` as JSON to `audit_log`
- **Sequential IDs** — RBAC IDs (`R001`, `RMM0001`) and certificate numbers (`MC-YYYYMM-NNNN`) are generated in application code, not via auto-increment, to maintain meaningful prefixes
- **Slot generation** — appointment slots built with a recursive CTE rather than a stored calendar table

---

## API Overview

Base URL: `http://localhost:3000`

| Category | Representative Endpoints | Auth |
|---|---|---|
| Authentication | `POST /login` · `POST /verify-otp` | Public |
| Users | `GET /users` · `POST /newuser` · `POST /changepassword` | JWT |
| RBAC | `GET/POST /api/roles` · `GET/POST /api/roles/:id/menus` · `GET/POST /api/users/:id/roles` | JWT (some Super Admin) |
| Menus | `GET /api/menus` · `GET /api/users/me/menus` | Public / JWT |
| Doctors | `GET /doctor` · `POST /doctor` · `GET /specializations` | JWT |
| Patients | `GET /fetchpat` · `POST /patient` · `GET /fetchpatreg` | JWT |
| Registration | `POST /registration` · `GET /fetch-registration` | JWT |
| Admission | `GET /beds` · `POST /admission` | JWT |
| Appointments | `GET /appointmentlist` · `POST /appointment` · `DELETE /appointment/:id` | JWT |
| Lab Tests | `GET /fetchTests` · `POST /saveTestGridData` · `POST /result` | JWT |
| Consultations | `POST /docConsultation` · `DELETE /docConsultation/:id` | JWT |
| Pharmacy | `POST /medicalItems` · `DELETE /docmedicalItems/:id` | JWT |
| Services | `GET /fetchServices` · `POST /patientCharges` | JWT |
| Prescriptions | `GET /fetch-prescription` · `POST /prescription` · `DELETE /prescription/:id` | JWT |
| Billing | `GET /patientBill` · `POST /payBill` | JWT |
| Razorpay | `POST /create-order` · `POST /verify` | JWT |
| Charts | `GET /firstChart` … `GET /eighthChart` | JWT |
| Reports | `/patientReportStateWise` · `/doctorWiseRegistrationFees` · `/deptTestDocFees` + 2 more | JWT |
| Queue | `POST /api/queue/token` · `GET /api/queue/live` · `PUT /api/queue/:id/status` + 8 more | JWT |
| Queue Display | `GET /api/queue/display/:counterId` | **Public** |
| Notifications | `GET /api/notifications/counts` | JWT |
| Patient Timeline | `GET /api/patient/:id/timeline` | JWT |
| Documents | `POST /api/patient-documents/upload` · preview · download · delete | JWT |
| Certificates | Full CRUD · `GET /api/medical-certificates/:id/pdf` | JWT |
| Login Audit | `GET /api/login-audit` · `POST /api/login-audit/logout` | JWT / Public |
| Chatbot | 9 endpoints across identify, message, appointments, slots | HMS JWT / Chatbot JWT |
| Bulk Import | `POST /import` (Excel → master data) | JWT |

---

## Folder Structure

```
Hospital-Management-System/
├── backend/
│   ├── config/
│   │   └── db.js                   # MySQL connection with auto-reconnect proxy + 4-min keep-alive
│   ├── models/
│   │   └── userModel.js            # findUserByUsername helper
│   ├── routes/                     # 50+ route files, one per domain
│   │   ├── auth.js                 # Login, OTP verification, JWT issuance
│   │   ├── authenticateJWT.js      # Shared JWT middleware
│   │   ├── chatbot.js              # Patient chat assistant state machine
│   │   ├── queue.js                # Queue management (12 endpoints)
│   │   ├── medicalCertificate.js   # Certificate CRUD + PDFKit streaming
│   │   ├── patientDocuments.js     # File upload, preview, download, soft-delete
│   │   ├── rolePermissions.js      # RBAC menu assignment
│   │   └── ...                     # All other clinical, billing, and report routes
│   ├── utils/
│   │   ├── auditHelper.js          # Fire-and-forget login audit inserts
│   │   ├── chatbotSession.js       # In-memory chatbot session store with inactivity sweep
│   │   └── certificatePdf.js       # PDFKit layout for medical certificates
│   ├── app.js                      # Express setup: CORS, middleware, route mounting
│   ├── server.js                   # HTTP server entry point
│   └── .env                        # Secrets (gitignored)
│
└── frontend/
    ├── public/
    └── src/
        ├── components/
        │   ├── SidebarMenu.jsx         # RBAC-filtered navigation tree
        │   ├── NotificationBell.jsx    # Live counts bell with popover
        │   ├── AppointmentChatbot.jsx  # Patient self-service chat widget
        │   ├── BreadCrumb.jsx          # Dynamic route breadcrumb
        │   └── ImportFile.jsx          # Excel bulk import UI
        ├── context/
        │   └── MenuContext.js          # Fetches and caches RBAC menu tree
        ├── pages/                      # 40+ page components, one per route
        │   ├── Charts.jsx              # 8-chart analytics dashboard
        │   ├── QueueManagement.jsx
        │   ├── RolePermissions.jsx     # Checkbox tree for menu-level assignment
        │   └── ...
        ├── utils/
        │   ├── authFetch.js            # Fetch wrapper: auto auth header + 401 redirect
        │   └── menuIcons.js            # MENU_CODE → icon component map
        ├── apiConfig.js                # API base URL from env or default
        └── App.js                      # Routes, FullyProtectedRoute, Layout
```

---

## Installation

### Prerequisites

- **Node.js** 18+
- **MySQL** 5.7+
- **Gmail account** with an [App Password](https://support.google.com/accounts/answer/185833) enabled
- **Razorpay account** (optional — only needed for online payment features)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-username/Hospital-Management-System.git
cd Hospital-Management-System

# 2. Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials, JWT secret, Gmail app password, and Razorpay keys
# Import the schema: mysql -u root -p hospital_management < database/schema.sql

# 3. Frontend setup
cd ../frontend
npm install
```

---

## Environment Variables

### `backend/.env`

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=hospital_management

# Authentication
JWT_SECRET=your_strong_random_secret_min_32_chars

# Email — Gmail App Password
GMAIL_USER=your_email@gmail.com
GMAIL_PASS=xxxx xxxx xxxx xxxx

# Payments (optional)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_SECRET=your_razorpay_secret
```

### `frontend/.env` (optional)

```env
# Defaults to http://localhost:3000 if omitted
REACT_APP_BACKEND_URL=http://localhost:3000
```

> **Note:** `.env` files are listed in `.gitignore` and must never be committed.

---

## Running the Project

### Development

```bash
# Terminal 1 — Backend (http://localhost:3000)
cd backend
npm start          # nodemon watches for changes

# Terminal 2 — Frontend (http://localhost:3001)
cd frontend
npm start          # CRA dev server with hot reload
```

### Tests

```bash
cd backend
npm test           # Jest + Supertest
```

### Production Build

```bash
cd frontend
npm run build      # Outputs optimised static assets to frontend/build/
```

---

## Security Features

| Feature | Implementation |
|---|---|
| Password hashing | bcrypt, 10 salt rounds |
| Two-factor authentication | Cryptographic 6-digit OTP, 5-minute expiry, cleared from DB after use |
| Account lockout | 3 failed attempts → 60-second lockout tracked at the database row |
| JWT authentication | HS256 signed, 24-hour expiry, verified on every protected route |
| Super Admin server-side guard | `req.user.isSuperAdmin` re-checked on privileged endpoints |
| CORS | Explicit allowed-origins list; unlisted origins rejected |
| Secrets management | All credentials in `.env`; file excluded from version control |
| Audit logging | Every create/update/delete writes old + new JSON diff to `audit_log` |
| Login audit trail | Every attempt (success and failure) logged with IP, user agent, session UUID |
| File upload validation | MIME type check + per-category allowed types + max file size per upload |
| Input validation | Phone (10-digit regex), email format, DOB, password length — validated on both client and server |
| Chatbot session isolation | Separate short-lived JWTs (2h) for chatbot sessions; in-memory store swept every 15 minutes |

---

## Future Enhancements

- [ ] MySQL connection pool (`mysql2/promise` pool to replace single connection)
- [ ] Redis session caching for improved scalability
- [ ] Push notifications for appointment reminders
- [ ] Doctor-scoped data access (doctors see only their assigned patients)
- [ ] Multi-branch / multi-tenancy support
- [ ] HL7/FHIR interoperability for EHR system integration
- [ ] Mobile-responsive PWA with offline capability
- [ ] Frontend component test coverage (Jest + React Testing Library)
- [ ] CI/CD pipeline with automated test runs on pull requests

---

## License

This project is licensed under the MIT License.
