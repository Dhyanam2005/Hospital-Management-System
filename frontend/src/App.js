import React from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet, Navigate } from 'react-router-dom';
import Login from './pages/LoginPage';
import Home from "./pages/HomePage";
import UserList from './pages/UserList';
import Newuser from './pages/NewUser';
import ProfilePage from "./pages/ProfilePage";
import ChangePassword from './pages/ChangePassword';
import Doctor from './pages/Doctor';
import NewDoctorPopUp from './pages/NewDoctorPopUp';
import NewPatient from './pages/NewPatient';
import Registration from './pages/Registration';
import Test from './pages/Test';
import Result from './pages/Result';
import PDF from './pages/PDF';
import DoctorWiseRegistration from './pages/DoctorWiseRegistration';
import PatientReportStateWise from './pages/PatientReportStateWise';
import DeptTestDocFees from './pages/DeptTestDocFees';
import DeptDocFees from './pages/DeptDocFees';
import ReferralDocReport from './pages/ReferralDocReport';
import DoctorConsultation from './pages/DoctorConsultation';
import MedicalItem from './pages/MedicalItem';
import PatientCharge from './pages/PatientCharge';
import Admission from './pages/Admission';
import Appointment from './pages/Appointment';
import PayBillBefore from './pages/PayBillBefore';
import ViewPatientBill from './pages/PatientsForBill';
import Charts from './pages/Charts';
import Prescription from './pages/Presrciption';
import Sidebar from './components/SidebarMenu';
import Breadcrumb from './components/BreadCrumb';
import LabTestMaster from './pages/LabTestmaster';
import LocationMaster from './pages/LocationMaster';
import PharmacyItemMaster from './pages/PharmacyItemMaster';
import FacilityMaster from './pages/FacilityMaster';
import DoctorMaster from './pages/DoctorMaster';
import PatientsForBill from './pages/PatientsForBill';
import ProfileButton from './pages/ProfileButton';
import AuditMaster from './pages/AuditMaster';
import DailyEarnings from './pages/DailyEarnings';
import OTP from './pages/OTP';
import NotFound from './pages/PageNotFound';
import MasterDataImport from './components/ImportFile';
import { allowedLabelsByRole } from './utils/allowedLabels';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem("token");
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const RoleProtectedRoute = ({ children, label }) => {
  const isAuthenticated = !!localStorage.getItem("token");
  const userType = parseInt(localStorage.getItem("user_type"));

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (userType === 1) return children;
  console.log(userType)
  const allowedLabels = allowedLabelsByRole[userType] || [];
  console.log(allowedLabels);
  return allowedLabels.includes(label) ? children : <Navigate to="/not-found" replace />;
};

function Layout() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-4">
        <div className='flex items-center justify-between'>
          <Breadcrumb />
          <ProfileButton />
        </div>
        <Outlet />
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/otp" element={<OTP />} />

        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Home />} />
          <Route path="/user-list" element={<RoleProtectedRoute label="User List"><UserList /></RoleProtectedRoute>} />
          <Route path="/new-user" element={<RoleProtectedRoute label="New User"><Newuser /></RoleProtectedRoute>} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/doctor" element={<RoleProtectedRoute label="Doctor"><Doctor /></RoleProtectedRoute>} />
          <Route path="/newdoctor" element={<RoleProtectedRoute label="New Doctor"><NewDoctorPopUp /></RoleProtectedRoute>} />
          <Route path="/new-doctor" element={<RoleProtectedRoute label="New Doctor"><NewDoctorPopUp /></RoleProtectedRoute>} />
          <Route path="/patient" element={<RoleProtectedRoute label="Patient"><NewPatient /></RoleProtectedRoute>} />
          <Route path="/registration" element={<RoleProtectedRoute label="Registration"><Registration /></RoleProtectedRoute>} />
          <Route path="/test" element={<RoleProtectedRoute label="Test"><Test /></RoleProtectedRoute>} />
          <Route path="/result" element={<RoleProtectedRoute label="Test Results"><Result /></RoleProtectedRoute>} />
          <Route path="/pdf" element={<RoleProtectedRoute label="PDF"><PDF /></RoleProtectedRoute>} />
          <Route path="/doctor-wise-reg" element={<RoleProtectedRoute label="Doctor Wise Registration"><DoctorWiseRegistration /></RoleProtectedRoute>} />
          <Route path="/patient-state-wise" element={<RoleProtectedRoute label="Patient State Wise"><PatientReportStateWise /></RoleProtectedRoute>} />
          <Route path="/dept-test-doc" element={<RoleProtectedRoute label="Dept Test Doc Fees"><DeptTestDocFees /></RoleProtectedRoute>} />
          <Route path="/dept-doc" element={<RoleProtectedRoute label="Dept Doc Fees"><DeptDocFees /></RoleProtectedRoute>} />
          <Route path="/referral-doc" element={<RoleProtectedRoute label="Referral Doc Report"><ReferralDocReport /></RoleProtectedRoute>} />
          <Route path="/consultation" element={<RoleProtectedRoute label="Doctor Consultations"><DoctorConsultation /></RoleProtectedRoute>} />
          <Route path="/medical-item" element={<RoleProtectedRoute label="Medical Item"><MedicalItem /></RoleProtectedRoute>} />
          <Route path="/service" element={<RoleProtectedRoute label="Service"><PatientCharge /></RoleProtectedRoute>} />
          <Route path="/admission" element={<RoleProtectedRoute label="Admission"><Admission /></RoleProtectedRoute>} />
          <Route path="/appointment" element={<RoleProtectedRoute label="Appointments"><Appointment /></RoleProtectedRoute>} />
          <Route path="/view-bills" element={<RoleProtectedRoute label="View Bills"><PatientsForBill /></RoleProtectedRoute>} />
          <Route path="/payment" element={<RoleProtectedRoute label="Payment"><PayBillBefore /></RoleProtectedRoute>} />
          <Route path="/chart" element={<RoleProtectedRoute label="Charts"><Charts /></RoleProtectedRoute>} />
          <Route path="/prescription" element={<RoleProtectedRoute label="Prescriptions"><Prescription /></RoleProtectedRoute>} />
          <Route path="/lab-test-master" element={<RoleProtectedRoute label="Lab Test Master"><LabTestMaster /></RoleProtectedRoute>} />
          <Route path="/location-master" element={<RoleProtectedRoute label="Location Master"><LocationMaster /></RoleProtectedRoute>} />
          <Route path="/pharmacy-item-master" element={<RoleProtectedRoute label="Pharmacy Item Master"><PharmacyItemMaster /></RoleProtectedRoute>} />
          <Route path="/facility-master" element={<RoleProtectedRoute label="Facility Master"><FacilityMaster /></RoleProtectedRoute>} />
          <Route path="/doctor-master" element={<RoleProtectedRoute label="Doctor Master"><DoctorMaster /></RoleProtectedRoute>} />
          <Route path="/audit-master" element={<RoleProtectedRoute label="Audit Master"><AuditMaster /></RoleProtectedRoute>} />
          <Route path="/daily-earnings" element={<RoleProtectedRoute label="Daily Earnings"><DailyEarnings /></RoleProtectedRoute>} />
          <Route path="/import-file" element={<RoleProtectedRoute label="Import data"><MasterDataImport /></RoleProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
