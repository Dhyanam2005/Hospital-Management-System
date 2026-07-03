# City General Hospital Management System

A full-stack, production-ready **Hospital Management System (HMS)** built with React, Node.js, Express, and MySQL. Designed to digitise and streamline clinical workflows across patient management, doctor operations, laboratory, pharmacy, billing, queue management, and administrative reporting — all under a robust, menu-level Role-Based Access Control system.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Authentication & Security](#authentication--security)
- [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
- [Patient Self-Service Chat Assistant](#patient-self-service-chat-assistant)
- [Database Design Overview](#database-design-overview)
- [API Overview](#api-overview)
- [Folder Structure](#folder-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [Security Features](#security-features)
- [Future Enhancements](#future-enhancements)
- [License](#license)

---

## Project Overview

The City General Hospital Management System is a comprehensive, multi-module web application that covers the end-to-end journey of a patient — from registration and appointment booking through lab tests, prescriptions, inpatient admission, billing, and discharge. It supports multiple user roles (Super Admin, Admin, Doctor, Receptionist, Lab Staff, Pharmacy, etc.) with fine-grained, database-driven menu-level permissions.

**Core design principles:**
- Every protected API route requires a valid JWT — no unauthenticated data access
- Authorisation is enforced on both the frontend (route guards) and backend (middleware)
- All mutations (create/update/delete) write structured audit logs with old/new JSON diffs
- Secrets never committed — `.env` excluded from git

---

## Key Features

### Authentication & User Management
- **OTP-Based Login** — 6-digit OTP sent via Gmail to registered email on every login; 5-minute expiry
- **Account Lockout** — 3 consecutive failed login attempts trigger a 1-minute lockout
- **JWT Sessions** — 24-hour JWT tokens containing `isSuperAdmin`, `roles`, and user identity; issued only after OTP verification
- **Password Management** — Users can change their own password; minimum 8 characters enforced; bcrypt hashed with 10 salt rounds
- **User Creation** — Super Admin can create new system user accounts (username, email, password)
- **User Listing** — View all registered system users with email and creation date
- **Profile View** — Authenticated users can view their own profile
- **Session Audit** — Every login/logout is recorded with IP, user agent, timestamps, session ID, and failure reason

### Role & Permission Management
- **Role CRUD** — Create, update, and list roles with auto-generated sequential IDs (`R001`, `R002`, …)
- **Menu-Level Permissions** — Assign any combination of the 50+ menu items to any role via an interactive checkbox tree UI
- **Multi-Role Users** — A single user can hold multiple roles simultaneously; permissions are unioned
- **User-Role Mapping** — Assign/revoke roles for any user; changes take effect at next login
- **isSuperAdmin Computation** — At login the system automatically determines if a user's combined roles cover all active menus; if yes, `isSuperAdmin=true` bypasses all permission checks

### Patient Management
- **Patient Registration** — Create new patient records with full demographics (name, DOB, age auto-calculated, sex, address, city, PIN, email, phone, next of kin), validated at input
- **Patient Search** — Search patients by name across all modules
- **Patient Timeline** — 360-degree view of a patient's full history across 11 event types: registration, appointments, admissions, discharges, consultations, lab tests, prescriptions, pharmacy, services, payments, and documents — with summary counts
- **Patient Documents** — Upload, preview, download, and soft-delete patient documents (PDF, images, Word files up to 50 MB); per-category file-type and size restrictions enforced at upload

### Doctor Management
- **Doctor Directory** — View and manage all in-house and external doctors with specialization, qualifications, and contact details
- **Doctor Creation** — Add new doctors with medical license number (uniqueness enforced), specialization, email, and phone; link to a system user account
- **Doctor Availability** — Define per-doctor working days and slot durations for appointment scheduling

### Appointment Scheduling
- **Slot-Based Booking** — Recursive CTE generates all available time slots for a doctor on a selected date; booked slots are excluded; past times excluded for today
- **Appointment Confirmation Emails** — Nodemailer sends booking confirmation to the patient's email on booking and cancellation
- **Appointment Cancellation** — Delete an appointment with cancellation email notification

### Clinical Services
- **Patient Registration (Clinical)** — Register a patient for a clinical visit (OP/IP), assign attending doctor, record registration charges, and set status
- **Inpatient Admission** — Assign ward, room, and bed; record admission reason and charges; automatically marks bed as occupied and updates registration status
- **Bed Management** — Real-time available bed listing with ward/room/bed labels; bed freed automatically on discharge
- **Doctor Consultations** — Record and manage doctor consultation entries with fees per visit
- **Lab Test Ordering** — Grid-based test ordering for a registration; supports multiple tests per visit
- **Lab Results Entry** — Enter numeric or character results per test detail; reference ranges displayed by result type (range, less-than, greater-than, positive/negative)
- **Prescriptions** — Doctors create and update prescriptions with drug, dosage schedule, and food instructions per line item; supports add/update/delete of individual prescription detail lines
- **Medical Certificates** — Generate `SICK_LEAVE` or `FITNESS` certificates with auto-numbered certificate IDs (`MC-YYYYMM-NNNN`); PDF generation via PDFKit streamed inline or as download; soft-cancel with reason

### Pharmacy & Services
- **Pharmacy Dispensing** — Issue drugs from the drug master to a patient registration with quantity, price, and total value; full audit log with old/new diff
- **Patient Services** — Assign hospital services (lab, scan, procedure, etc.) to patient registrations with associated doctor and charges
- **Pharmacy Item Master** — Maintain the drug master list for all pharmaceutical inventory

### Billing & Payments
- **Bill Viewing** — Consolidated bill view via database view (`v_patient_bill`) showing all charge categories (registration, admission, ward, doctor, tests, pharmacy, services)
- **Daily Earnings** — Breakdown of daily revenue by category (registration, admission, doctor fee, tests, services, ward) grouped by payment date
- **Cash Payment** — Record final bill payment with discount, mode of payment, and payment detail; automatically discharges patient and frees bed
- **Razorpay Integration** — Online payment support: creates Razorpay orders in INR paise and verifies payments via Razorpay API

### Queue Management
- **Counter Management** — Create and configure queue counters with token prefix, linked doctor/department, and average consultation time
- **Token Generation** — Issue sequential queue tokens (prefix + 3-digit number) with estimated wait time (active count × avg consult time); duplicate-token prevention per patient per doctor per day
- **Live Queue View** — Real-time queue display filterable by counter, doctor, status, and date
- **Status Transitions** — Advance tokens through: `WAITING → CALLED → WITH_DOCTOR → COMPLETED` (or `SKIPPED / CANCELLED / NO_SHOW`) with automatic timestamping at each transition
- **Public Display Board** — Unauthenticated endpoint for counter display screens: shows current token and next 4 waiting tokens
- **Doctor Queue Dashboard** — Doctor-facing view showing current patient, next patient, and completed count for today
- **Queue Reports** — Dashboard aggregate stats, full daily detail, doctor-wise summary, and per-patient wait/consult time analysis

### Analytics & Reporting
- **8 Live Dashboard Charts** (all data fetched in parallel on page load):
  - Top 5 Lab Tests by Count
  - Top 5 Lab Tests by Revenue
  - Top 5 Pharmacy Items by Revenue
  - Top Doctors by Total Revenue
  - Patient Gender Distribution (Pie chart)
  - Admissions & Discharges by Date
  - Patients by City
  - Patients by Age Group (10-year buckets)
- **Tabular Reports** with date-range filters:
  - Patient Report State-Wise
  - Doctor-Wise Registration & Collection
  - Department-Test-Doctor Fees
  - Department-Doctor Fees
  - Referral Doctor Summary
- **Audit Master** — View all data-change audit logs (table, record, old/new JSON diff, timestamp, user)
- **Login Audit Report** — Paginated login history with filters (date range, username, status); records all SUCCESS and FAILED attempts with failure reasons, IP, and user agent
- **Excel Export** — Tabular reports can be exported to Excel using `xlsx` + `file-saver`

### Master Data Management
- **Lab Test Master** — Manage test catalogue: name, category, specimen type, result type, reference ranges, units, and charges
- **Location Master** — Country / State / City hierarchy management
- **Facility Master** — Ward, room, and bed configuration with ward charges
- **Doctor Master** — Doctor reference data
- **Document Master** — Document category management with per-category allowed file types, max file size, and display order
- **Bulk Import** — Upload Excel files to bulk-import Country, State, City, Service, and Test master data via `multer` + `xlsx`

### Notifications
- **Live Notification Bell** — Header bell icon with live badge count; popover shows 7 real-time counters:
  - Today's appointments
  - Today's new admissions
  - Current inpatients (no discharge date)
  - Today's payments
  - Today's lab tests
  - Available beds / Occupied beds
- Each notification item links directly to the relevant module page

### Patient Self-Service Chat Assistant
- Embedded chat widget on the **Login page** — accessible to patients without staff login
- Rule-based state machine (not an LLM) for deterministic, reliable interactions
- Patient identification by **Patient ID** or **phone number**; handles multi-patient disambiguation for shared phone numbers
- Capabilities via natural language:
  - **Book** an appointment (doctor selection → date → slot → confirm)
  - **View upcoming** appointments
  - **View history** of past appointments
  - **Reschedule** an existing appointment
  - **Cancel** an appointment
- Natural language date parsing: "today", "tomorrow", "next Monday", "3rd January 2026", DD/MM/YYYY, ISO dates
- Time period recognition: "morning" (5 AM–12 PM), "afternoon" (12 PM–5 PM), "evening" (5 PM–9 PM)
- Race-condition-safe transactional booking (double-checks slot availability inside the transaction)
- Separate session management: 2-hour chatbot JWTs with 15-minute inactivity sweep
- Automatically suggests next available date if a doctor has no slots on the requested day

---

## Architecture Overview

```
┌──────────────────────────────────────────────┐
│                  Browser (React)             │
│  React Router v7 · MUI v7 · Recharts         │
│  FullyProtectedRoute → MenuContext (RBAC)    │
│  authFetch() → injects Bearer JWT on all API │
│  calls, redirects to /login on 401           │
└────────────────────┬─────────────────────────┘
                     │ HTTP / CORS whitelist
┌────────────────────▼─────────────────────────┐
│           Express.js Backend (Node.js)        │
│  CORS · express.json · 53 route modules       │
│  authenticateJWT middleware (shared)          │
│  auditHelper (fire-and-forget audit inserts)  │
│  chatbotSession (in-memory Map + sweep)       │
└────────────────────┬─────────────────────────┘
                     │ mysql2 callback API
┌────────────────────▼─────────────────────────┐
│                  MySQL 5.7+                   │
│  Single connection with auto-reconnect        │
│  Keep-alive SELECT 1 every 4 minutes          │
│  Proxy export for transparent reconnects      │
│  Views: v_patient_bill, v_patient_bill_summary│
│          v_referralDoc                        │
└──────────────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────┐
│            External Services                  │
│  Gmail (Nodemailer) — OTP + appointment emails│
│  Razorpay — online payment orders + verify    │
└──────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.1.0 | UI framework |
| React Router | 7.6.0 | Client-side routing with nested layouts |
| Material UI | 7.1.0 | Component library (Clinical Blue design system) |
| MUI X DataGrid | 8.5.0 | Feature-rich data tables with pagination |
| Recharts | 2.15.3 | Dashboard analytics charts |
| @react-pdf/renderer | 4.3.0 | In-browser PDF generation |
| PDFKit (via backend) | 0.19.1 | Server-side PDF streaming for certificates |
| Lucide React | 0.511.0 | Icon library |
| xlsx + file-saver | 0.18.5 / 2.0.5 | Excel export for tabular reports |
| date-fns | 4.1.0 | Date formatting utilities |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js + Express | 5.1.0 | HTTP server and routing |
| mysql2 | 3.14.1 | MySQL database driver (callback API) |
| jsonwebtoken | 9.0.2 | JWT signing and verification |
| bcryptjs | 3.0.2 | Password hashing |
| Nodemailer | 7.0.3 | OTP and appointment emails via Gmail |
| multer | 2.0.1 | Multipart file upload handling |
| Razorpay SDK | 2.9.6 | Payment gateway integration |
| PDFKit | 0.19.1 | PDF generation for medical certificates |
| xlsx | 0.18.5 | Excel parsing for bulk master data import |
| date-fns | 4.1.0 | Date calculations in reports |
| dotenv | 16.5.0 | Environment variable management |
| cors | 2.8.5 | Cross-origin resource sharing |

### Database
- **MySQL 5.7+** — relational schema with 30+ tables, 3 views, stored as normalised entities
- No ORM — all queries written in raw SQL via mysql2 callback API

### Development Tools
| Tool | Purpose |
|---|---|
| Nodemon | Auto-restart backend on file change |
| Jest + Supertest | Backend unit and integration testing |
| Create React App | Frontend build tooling |
| Tailwind CSS | Utility classes (available, MUI primary for UI) |

---

## Authentication & Security

### Login Flow

```
1. POST /login
   ├─ Validate username + bcrypt password
   ├─ Check account lockout (3 failures → 60s lock)
   ├─ Generate 6-digit OTP via crypto.randomInt
   ├─ Store OTP + expiry (5 min) in user row
   └─ Send OTP via Gmail (Nodemailer)

2. POST /verify-otp
   ├─ Validate OTP match and expiry
   ├─ Clear OTP from database
   ├─ Generate UUID session ID → insert LOGIN_AUDIT
   ├─ Fetch user's active role IDs
   ├─ Compute isSuperAdmin (role menu coverage vs total active menus)
   ├─ Sign 24h JWT: { id, user_name, isSuperAdmin, roles: [roleIds] }
   └─ Return { token, isSuperAdmin, audit_session_id }

3. All subsequent requests
   └─ authenticateJWT middleware verifies JWT on every protected route
      └─ Sets req.user = decoded payload → next()
```

### JWT Structure
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

### Frontend Auth
- `authFetch()` utility wraps all API calls — injects `Authorization: Bearer <token>` automatically
- On any `401` response → clears localStorage → redirects to `/login`
- `FullyProtectedRoute` component guards all non-public routes
- Super Admin bypass: `isSuperAdmin=true` skips all menu-URL permission checks

---

## Role-Based Access Control (RBAC)

The system implements a fully database-driven, menu-level RBAC system.

### Data Model
```
MENU_MASTER (M001..M050)
    ↑ many-to-many
rmm_role_menu_mapping (RMM0001..)
    ↑ many-to-many
ROLE_MASTER (R001..R00N)
    ↑ many-to-many
urm_user_role_mapping (URM0001..)
    ↑ many-to-one
user
```

### How It Works
1. **At login** — the backend fetches all role IDs the user holds from `urm_user_role_mapping`
2. **isSuperAdmin** — if the union of all role menus covers 100% of active menus in `MENU_MASTER`, `isSuperAdmin=true` is embedded in the JWT
3. **Menu fetch** — after login, the frontend calls `GET /api/users/me/menus`; the backend returns only menus the user is allowed; ancestors are included for correct hierarchy rendering
4. **Route guard** — `FullyProtectedRoute` collects all `MENU_URL` values from the menu tree; if the current path is not in the set and `isSuperAdmin=false`, the user is redirected to `/not-found`
5. **API guard** — Super Admin-only endpoints (create user, create role, assign permissions) check `req.user.isSuperAdmin` server-side
6. **Multi-role** — a user with multiple roles gets the union of all permitted menus

### Menu Hierarchy
The 50 menus are organised in a 2–3 level hierarchy:
```
Security → New User, User List, Role, Role Permission, User Role Mapping, Login Audit
Master   → Location, Lab Test, Pharmacy Items, Facility, Doctor, Import Data
Patient  → New Patient, Patient List, Patient Documents, Patient Timeline
Clinical Services → Registration, Admission, Appointments, Test, Results,
                    Pharmacy Dispensing, Patient Services, Prescriptions,
                    Doctor Consultations, Medical Certificates
Doctor   → Doctor Directory, New Doctor, Doctor Consultations, Prescriptions
Billing  → View Bills, Payment
Reports  → Tabular (5 sub-reports), Audit Master, Daily Earnings, Charts
Queue    → Queue Management
```

---

## Patient Self-Service Chat Assistant

An embedded chat widget on the **Login page** allows patients to self-serve common tasks without staff involvement. Built as a deterministic **rule-based state machine** — no external AI/LLM dependency, ensuring reliability and data privacy.

### Architecture
```
AppointmentChatbot (React component, LoginPage)
    └── POST /api/chatbot/identify (HMS JWT required — staff identifies patient)
    └── Separate chatbot session JWT (2h TTL, in-memory Map)
    └── POST /api/chatbot/message (main conversation endpoint)
    └── GET  /api/chatbot/doctors + /slots
    └── POST/PUT/DELETE /api/chatbot/appointments
```

### State Machine Flows
```
IDLE ──book──────► BOOKING_DOCTOR → BOOKING_DATE → BOOKING_SLOT → BOOKING_CONFIRM
     ──reschedule► RESCHEDULE_SELECT → RESCHEDULE_DATE → RESCHEDULE_SLOT → RESCHEDULE_CONFIRM
     ──cancel─────► CANCEL_SELECT → CANCEL_CONFIRM
     ──upcoming───► (immediate list response)
     ──history────► (immediate list response)
```

### Natural Language Capabilities
- Date recognition: "today", "tomorrow", "next Monday", "3rd January 2026", `DD/MM/YYYY`, ISO format
- Time period recognition: "morning" (5–12), "afternoon" (12–17), "evening" (17–21)
- Intent detection via keyword regex matching
- Auto-suggests next available date if doctor has no slots on requested day

---

## Database Design Overview

### Core Entities (30+ tables)

| Domain | Tables |
|---|---|
| Users & Auth | `user`, `LOGIN_AUDIT` |
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
| RBAC | `ROLE_MASTER`, `MENU_MASTER`, `rmm_role_menu_mapping`, `urm_user_role_mapping` |
| Queue | `TOKEN_COUNTER_MASTER`, `PATIENT_QUEUE` |
| Audit | `audit_log` |
| Documents | `DOCUMENT_MASTER`, `PATIENT_DOCUMENT` |
| Certificates | `MEDICAL_CERTIFICATE` |

### Key Design Decisions
- **Bed lifecycle**: `ward_room_bed.bed_status` toggles `A` (available) ↔ `O` (occupied) atomically with admission/discharge
- **Registration status**: `reg_status` tracks `R` (registered) → `A` (admitted) → `D` (discharged) lifecycle
- **Audit diffs**: `audit_log` stores full `old_data` and `new_data` as JSON for every mutation
- **Sequential IDs**: RBAC IDs (`R001`, `RMM0001`, `URM0001`) and certificate numbers (`MC-YYYYMM-NNNN`) are auto-generated in-application
- **Views**: `v_patient_bill`, `v_patient_bill_summary`, `v_referralDoc` for complex aggregations

---

## API Overview

All APIs are mounted at the root path. Base URL: `http://localhost:3000`

| Category | Endpoints | Auth |
|---|---|---|
| Authentication | `POST /login`, `POST /verify-otp` | Public |
| Users | `GET /users`, `POST /newuser`, `GET /user`, `POST /changepassword` | JWT |
| Doctors | `GET /doctor`, `POST /doctor`, `GET /specializations`, `GET /fetchInHouseDoctors` | JWT |
| Patients | `GET /fetchpat`, `GET /fetchAllPatients`, `POST /patient`, `GET /fetchpatreg` | JWT |
| Registration | `GET /fetch-registration`, `POST /registration`, `GET /regStatus` | JWT |
| Admission | `GET /beds`, `GET /fetchAdmission`, `POST /admission` | JWT |
| Appointments | `GET /appointmentlist`, `POST /appointment`, `DELETE /appointment/:id` | JWT |
| Lab Tests | `GET /fetchTests`, `POST /saveTestGridData`, `GET /resultData`, `POST /result` | JWT |
| Consultations | `GET /consultationDoc`, `POST /docConsultation`, `DELETE /docConsultation/:id` | JWT |
| Pharmacy | `GET /fetchMedicines`, `POST /medicalItems`, `DELETE /docmedicalItems/:id` | JWT |
| Services | `GET /fetchServices`, `GET /fetchPatientCharges`, `POST /patientCharges` | JWT |
| Prescriptions | `GET /fetchLatestRegPatient`, `GET /fetch-prescription`, `POST /prescription`, `DELETE /prescription/:id` | JWT |
| Billing | `GET /patientBill`, `GET /payBill`, `POST /payBill` | JWT |
| Payments | `POST /create-order`, `POST /verify` | JWT |
| Charts | `GET /firstChart` – `GET /eighthChart` | JWT |
| Reports | `GET /patientReportStateWise`, `/doctorWiseRegistrationFees`, `/deptTestDocFees`, `/deptDocFees`, `/referralDoc` | JWT |
| Master Data | `GET /lab-test-master`, `/location-master`, `/pharmacy-item-master`, `/facility-master`, `/audit-master`, `/daily-earnings` | JWT |
| Queue | `GET/POST /api/queue/counters`, `POST /api/queue/token`, `GET /api/queue/live`, `PUT /api/queue/:id/status`, + 4 report endpoints | JWT |
| Queue Display | `GET /api/queue/display/:counterId` | **Public** |
| RBAC | `GET/POST/PUT /api/roles`, `GET/POST /api/roles/:id/menus`, `GET/POST /api/users/:id/roles` | JWT (some Super Admin only) |
| Menus | `GET /api/menus`, `GET /api/users/me/menus` | Public / JWT |
| Notifications | `GET /api/notifications/counts` | JWT |
| Timeline | `GET /api/patient/:id/timeline` | JWT |
| Documents | `GET/POST /api/patient-documents/upload`, `GET /api/patient-documents/:patientId`, preview, download, delete | JWT |
| Certificates | Full CRUD + PDF preview/download | JWT |
| Login Audit | `GET /api/login-audit`, `POST /api/login-audit/logout` | JWT / Public |
| Chatbot | 9 endpoints across identify, message, appointments, slots | HMS JWT / Chatbot JWT |
| Import | `POST /import` (Excel bulk import) | JWT |
| Cities | `GET /cities` | **Public** |
| PDF | `GET /patientpdf`, `GET /testpdf` | JWT |

---

## Folder Structure

```
Hospital-Management-System/
├── backend/
│   ├── config/
│   │   └── db.js                  # MySQL single-connection with auto-reconnect + keep-alive proxy
│   ├── models/
│   │   └── userModel.js           # findUserByUsername helper
│   ├── routes/                    # 30+ route files (one file per domain)
│   │   ├── auth.js                # Login + OTP verification + JWT issuance
│   │   ├── authenticateJWT.js     # Shared JWT middleware
│   │   ├── chatbot.js             # Patient chat assistant (state machine)
│   │   ├── queue.js               # Queue management (12 endpoints)
│   │   ├── medicalCertificate.js  # Certificate CRUD + PDF streaming
│   │   ├── patientDocuments.js    # Document upload/preview/download
│   │   ├── rolePermissions.js     # RBAC menu assignment
│   │   └── ...                    # All other clinical/billing/report routes
│   ├── utils/
│   │   ├── auditHelper.js         # Fire-and-forget login audit inserts
│   │   ├── chatbotSession.js      # In-memory chatbot session store
│   │   └── certificatePdf.js      # PDFKit certificate generation
│   ├── app.js                     # Express app setup, CORS, middleware, route mounting
│   ├── server.js                  # HTTP server entry point
│   └── .env                       # Environment variables (gitignored)
│
└── frontend/
    ├── public/
    └── src/
        ├── components/
        │   ├── SidebarMenu.jsx        # RBAC-filtered navigation tree
        │   ├── NotificationBell.jsx   # Live counts bell with popover
        │   ├── AppointmentChatbot.jsx # Patient self-service chat widget
        │   ├── BreadCrumb.jsx         # Route breadcrumb
        │   └── ImportFile.jsx         # Excel bulk import UI
        ├── context/
        │   └── MenuContext.js         # Fetches + caches RBAC menu tree; exposes refreshMenus()
        ├── pages/                     # 40+ page components (one per route)
        │   ├── LoginPage.jsx
        │   ├── OTP.jsx
        │   ├── Charts.jsx             # 8-chart analytics dashboard
        │   ├── QueueManagement.jsx
        │   ├── RolePermissions.jsx    # Checkbox tree for menu assignment
        │   └── ...
        ├── utils/
        │   ├── authFetch.js           # Fetch wrapper with auto auth header + 401 redirect
        │   └── menuIcons.js           # MENU_CODE → icon component map
        ├── apiConfig.js               # API base URL from env or default localhost:3000
        └── App.js                     # Routes, FullyProtectedRoute, Layout
```

---

## Installation

### Prerequisites
- **Node.js** 18+
- **MySQL** 5.7+
- **Gmail account** with an [App Password](https://support.google.com/accounts/answer/185833) configured
- **Razorpay account** (for payment features; optional)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-username/Hospital-Management-System.git
cd Hospital-Management-System

# 2. Set up the backend
cd backend
npm install
cp .env.example .env          # Edit with your credentials
# (Import the database schema from DB_Queries/)

# 3. Set up the frontend
cd ../frontend
npm install
```

---

## Environment Variables

### Backend — `backend/.env`

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
JWT_SECRET=your_strong_random_secret_here

# Email (Gmail App Password)
GMAIL_USER=your_email@gmail.com
GMAIL_PASS=xxxx xxxx xxxx xxxx

# Payments (optional)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_SECRET=your_razorpay_secret
```

### Frontend — `frontend/.env` (optional)

```env
# Defaults to http://localhost:3000 if not set
REACT_APP_BACKEND_URL=http://localhost:3000
```

> **Important:** Never commit `.env` files. Both are listed in `.gitignore`.

---

## Running the Project

### Development

```bash
# Terminal 1 — Backend (http://localhost:3000)
cd backend
npm start          # uses nodemon for auto-reload

# Terminal 2 — Frontend (http://localhost:3001)
cd frontend
npm start          # Create React App dev server with hot reload
```

### Running Tests

```bash
cd backend
npm test           # Jest + Supertest
```

### Production Build

```bash
cd frontend
npm run build      # Outputs to frontend/build/

# Serve the build folder with any static server, or configure Express to serve it
```

---

## Security Features

| Feature | Implementation |
|---|---|
| Password hashing | bcrypt with 10 salt rounds |
| OTP-based 2FA | 6-digit cryptographic OTP, 5-minute expiry, cleared after use |
| Account lockout | 3 failed attempts → 60-second lockout, tracked in database |
| JWT authentication | HS256 signed, 24-hour expiry, verified on every protected API call |
| Authorisation middleware | `authenticateJWT` on all 26+ data endpoints |
| Super Admin guard | `req.user.isSuperAdmin` checked server-side for privileged operations |
| CORS whitelist | Explicit allowed-origins list; requests from unlisted origins rejected |
| Secrets in environment | No credentials in source code; `.env` gitignored |
| Structured audit logs | Every create/update/delete writes old+new JSON diff to `audit_log` |
| Login audit trail | Every login attempt (success + failure) logged with IP, user agent, session ID |
| Session tracking | Logout timestamps recorded for session duration audit |
| File upload validation | MIME type check + per-category allowed types + max file size enforcement |
| Input validation | Phone (10-digit), email regex, DOB format, password length — all validated server-side |

---

## Future Enhancements

- [ ] Razorpay payment signature verification (HMAC-SHA256)
- [ ] Database connection pool (replace single connection with `mysql2/promise` pool)
- [ ] Redis-based session caching (dependency already installed)
- [ ] Push notifications for appointment reminders
- [ ] Role-based data scoping (doctors see only their own patient data)
- [ ] Multi-tenancy / multi-branch hospital support
- [ ] HL7/FHIR interoperability for EHR integration
- [ ] Mobile-responsive PWA
- [ ] Automated test coverage for frontend components

---

## License

This project is developed for **City General Hospital** internal operations.
