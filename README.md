# City General Hospital Management System

A full-stack, role-based Hospital Management System built with **React**, **Node.js**, **Express**, and **MySQL**. Designed to streamline clinical workflows, patient management, billing, reporting, and administrative operations in a secure, multi-user environment.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Security](#security)
- [Modules](#modules)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)

---

## Features

- **OTP-Based Authentication** — Email OTP verification at every login with 5-minute expiry
- **Role-Based Access Control (RBAC)** — Menu-level permissions per role, enforced on both frontend and backend
- **Patient Registration & Admission** — Full IP/OP patient lifecycle management
- **Appointment Scheduling** — Doctor-wise appointment booking and tracking
- **Clinical Services** — Lab tests, prescriptions, doctor consultations, and medical certificates
- **Pharmacy & Inventory** — Medical item management with revenue tracking
- **Billing & Payments** — Bill generation, service charges, and Razorpay payment gateway integration
- **Queue Management** — Real-time counter-based patient queue with public display support
- **Reports & Analytics** — Chart-based and tabular reports across doctors, labs, billing, and referrals
- **Login Audit** — Track all login events, session durations, and failures
- **Notifications** — In-app notification system for staff
- **Patient Timeline & Documents** — Full patient history, document uploads, and medical certificates

---

## Tech Stack

**Frontend**
- React.js (Create React App)
- React Router v6
- Material UI v7 + MUI DataGrid v8
- Lucide React (icons)
- Fetch API with JWT auth injection

**Backend**
- Node.js + Express.js
- mysql2 (callback-style)
- bcryptjs (password hashing)
- jsonwebtoken (JWT)
- Nodemailer (OTP emails via Gmail)
- Razorpay SDK (payment gateway)

**Database**
- MySQL 5.7+

---

## Security

| Layer | Implementation |
|---|---|
| Authentication | OTP via email + JWT (24h expiry) |
| Authorization | Role-menu mapping; `isSuperAdmin` flag in JWT |
| Password storage | bcrypt with salt rounds = 10 |
| Account lockout | 3 failed attempts → 1-minute lockout |
| API protection | `authenticateJWT` middleware on all protected routes |
| CORS | Whitelist of allowed origins only |
| Secrets | All credentials in `.env`, never committed |
| Audit trail | Login/logout events logged with session IDs |

---

## Modules

| Module | Description |
|---|---|
| Security | User management, Role management, Role permissions, User-role mapping, Login audit |
| Master | Lab test master, Location master, Pharmacy item master, Facility master, Doctor master |
| Patient | New patient registration, Patient list, Patient documents, Patient timeline |
| Clinical Services | Registration, Test entry, Results, Prescriptions, Doctor consultations, Admission, Medical certificates |
| Doctor | Doctor directory, Doctor-wise registration report |
| Billing | View bills, Payment (cash + Razorpay), Daily earnings |
| Reports | Patient statewise, Department-test-doctor fees, Referral doctor summary, Charts & analytics |
| Queue | Counter-based queue management with public display board |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 5.7+
- Gmail account (for OTP emails)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/Hospital-Management-System.git
cd Hospital-Management-System

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running Locally

```bash
# Terminal 1 — Backend (port 3000)
cd backend
npm start

# Terminal 2 — Frontend (port 3001)
cd frontend
npm start
```

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=hospital_management
JWT_SECRET=your_jwt_secret_here
GMAIL_USER=your_email@gmail.com
GMAIL_PASS=your_gmail_app_password
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_SECRET=your_razorpay_secret
```

> Gmail requires an **App Password** (not your account password). Generate one at Google Account → Security → App Passwords.

---

## Project Structure

```
Hospital-Management-System/
├── backend/
│   ├── config/          # Database connection
│   ├── models/          # User model
│   ├── routes/          # All API route handlers
│   ├── utils/           # Audit helper, shared utilities
│   ├── app.js           # Express app setup
│   └── server.js        # Server entry point
└── frontend/
    ├── public/
    └── src/
        ├── components/  # Sidebar, Breadcrumb, Notifications
        ├── context/     # MenuContext (RBAC menu state)
        ├── pages/       # All page components
        ├── utils/       # authFetch utility
        └── App.js       # Routes and FullyProtectedRoute
```

---

## License

This project is for internal use at City General Hospital.
