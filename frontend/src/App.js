import React , { useEffect} from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet, Navigate, useLocation } from 'react-router-dom';
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
import PatientDocuments from './pages/PatientDocuments';
import DocumentMasterPage from './pages/DocumentMasterPage';
import PatientTimeline from './pages/PatientTimeline';
import MedicalCertificatePage from './pages/MedicalCertificatePage';
import QueueManagement from './pages/QueueManagement';
import RoleManagement from './pages/RoleManagement';
import RolePermissions from './pages/RolePermissions';
import UserRoleMapping from './pages/UserRoleMapping';
import LoginAudit from './pages/LoginAudit';
import { MenuProvider, useMenu } from './context/MenuContext';
import NotificationBell from './components/NotificationBell';

function collectMenuUrls(nodes, out = new Set()) {
  nodes.forEach(n => {
    if (n.MENU_URL) out.add(n.MENU_URL);
    if (n.children?.length) collectMenuUrls(n.children, out);
  });
  return out;
}

const FullyProtectedRoute = ({ children, label }) => {
  const [loading, setLoading]         = React.useState(true);
  const [isAuthenticated, setAuth]    = React.useState(false);
  const { menuTree, loading: menuLoading } = useMenu();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    setAuth(!!token);
    setLoading(false);
  }, []);

  if (loading || menuLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Route-level permission check: only for labeled routes and non-superadmin users
  const isSuperAdmin = localStorage.getItem('isSuperAdmin') === 'true';
  if (label && !isSuperAdmin && menuTree.length > 0) {
    const allowedUrls = collectMenuUrls(menuTree);
    if (!allowedUrls.has(location.pathname)) {
      return <Navigate to="/not-found" replace />;
    }
  }

  return children;
};



function Layout() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-[20%]" style={{ minHeight: '100vh', backgroundColor: '#f0f4f8' }}>
        {/* Top header bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', height: 56,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
          position: 'sticky', top: 0, zIndex: 99,
        }}>
          <Breadcrumb />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <NotificationBell />
            <ProfileButton />
          </div>
        </div>
        {/* Page content */}
        <div style={{ padding: '24px' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <MenuProvider>
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/otp" element={<OTP />} />
        <Route element={<FullyProtectedRoute><Layout /></FullyProtectedRoute>}>
          <Route path="/" element={<Home />} />
          <Route path="/user-list" element={<FullyProtectedRoute label="User List"><UserList /></FullyProtectedRoute>} />
          <Route path="/new-user" element={<FullyProtectedRoute label="New User"><Newuser /></FullyProtectedRoute>} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/doctor" element={<FullyProtectedRoute label="Doctor"><Doctor /></FullyProtectedRoute>} />
          <Route path="/newdoctor" element={<FullyProtectedRoute label="New Doctor"><NewDoctorPopUp /></FullyProtectedRoute>} />
          <Route path="/new-doctor" element={<FullyProtectedRoute label="New Doctor"><NewDoctorPopUp /></FullyProtectedRoute>} />
          <Route path="/patient" element={<FullyProtectedRoute label="Patient"><NewPatient /></FullyProtectedRoute>} />
          <Route path="/registration" element={<FullyProtectedRoute label="Registration"><Registration /></FullyProtectedRoute>} />
          <Route path="/test" element={<FullyProtectedRoute label="Test"><Test /></FullyProtectedRoute>} />
          <Route path="/result" element={<FullyProtectedRoute label="Test Results"><Result /></FullyProtectedRoute>} />
          <Route path="/pdf" element={<FullyProtectedRoute label="PDF"><PDF /></FullyProtectedRoute>} />
          <Route path="/doctor-wise-reg" element={<FullyProtectedRoute label="Doctor Wise Registration"><DoctorWiseRegistration /></FullyProtectedRoute>} />
          <Route path="/patient-state-wise" element={<FullyProtectedRoute label="Patient State Wise"><PatientReportStateWise /></FullyProtectedRoute>} />
          <Route path="/dept-test-doc" element={<FullyProtectedRoute label="Dept Test Doc Fees"><DeptTestDocFees /></FullyProtectedRoute>} />
          <Route path="/dept-doc" element={<FullyProtectedRoute label="Dept Doc Fees"><DeptDocFees /></FullyProtectedRoute>} />
          <Route path="/referral-doc" element={<FullyProtectedRoute label="Referral Doc Report"><ReferralDocReport /></FullyProtectedRoute>} />
          <Route path="/consultation" element={<FullyProtectedRoute label="Doctor Consultations"><DoctorConsultation /></FullyProtectedRoute>} />
          <Route path="/medical-item" element={<FullyProtectedRoute label="Medical Item"><MedicalItem /></FullyProtectedRoute>} />
          <Route path="/service" element={<FullyProtectedRoute label="Service"><PatientCharge /></FullyProtectedRoute>} />
          <Route path="/admission" element={<FullyProtectedRoute label="Admission"><Admission /></FullyProtectedRoute>} />
          <Route path="/appointment" element={<FullyProtectedRoute label="Appointments"><Appointment /></FullyProtectedRoute>} />
          <Route path="/view-bills" element={<FullyProtectedRoute label="View Bills"><PatientsForBill /></FullyProtectedRoute>} />
          <Route path="/payment" element={<FullyProtectedRoute label="Payment"><PayBillBefore /></FullyProtectedRoute>} />
          <Route path="/chart" element={<FullyProtectedRoute label="Charts"><Charts /></FullyProtectedRoute>} />
          <Route path="/prescription" element={<FullyProtectedRoute label="Prescriptions"><Prescription /></FullyProtectedRoute>} />
          <Route path="/lab-test-master" element={<FullyProtectedRoute label="Lab Test Master"><LabTestMaster /></FullyProtectedRoute>} />
          <Route path="/location-master" element={<FullyProtectedRoute label="Location Master"><LocationMaster /></FullyProtectedRoute>} />
          <Route path="/pharmacy-item-master" element={<FullyProtectedRoute label="Pharmacy Item Master"><PharmacyItemMaster /></FullyProtectedRoute>} />
          <Route path="/facility-master" element={<FullyProtectedRoute label="Facility Master"><FacilityMaster /></FullyProtectedRoute>} />
          <Route path="/doctor-master" element={<FullyProtectedRoute label="Doctor Master"><DoctorMaster /></FullyProtectedRoute>} />
          <Route path="/audit-master" element={<FullyProtectedRoute label="Audit Master"><AuditMaster /></FullyProtectedRoute>} />
          <Route path="/daily-earnings" element={<FullyProtectedRoute label="Daily Earnings"><DailyEarnings /></FullyProtectedRoute>} />
          <Route path="/import-file" element={<FullyProtectedRoute label="Import data"><MasterDataImport /></FullyProtectedRoute>} />
          <Route path="/patient-documents" element={<FullyProtectedRoute label="Patient Documents"><PatientDocuments /></FullyProtectedRoute>} />
          <Route path="/document-master" element={<FullyProtectedRoute label="Document Master"><DocumentMasterPage /></FullyProtectedRoute>} />
          <Route path="/patient-timeline" element={<FullyProtectedRoute label="Patient Timeline"><PatientTimeline /></FullyProtectedRoute>} />
          <Route path="/medical-certificates" element={<FullyProtectedRoute label="Medical Certificates"><MedicalCertificatePage /></FullyProtectedRoute>} />
          <Route path="/queue-management" element={<FullyProtectedRoute label="Queue Management"><QueueManagement /></FullyProtectedRoute>} />
          <Route path="/role" element={<FullyProtectedRoute label="Role"><RoleManagement /></FullyProtectedRoute>} />
          <Route path="/role-permission" element={<FullyProtectedRoute label="Role Permissions"><RolePermissions /></FullyProtectedRoute>} />
          <Route path="/user-role-mapping" element={<FullyProtectedRoute label="User Role Mapping"><UserRoleMapping /></FullyProtectedRoute>} />
          <Route path="/reports/login-audit" element={<FullyProtectedRoute label="Login Audit"><LoginAudit /></FullyProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
    </MenuProvider>
  );
}

export default App;
