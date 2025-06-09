import React from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet } from 'react-router-dom';
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
import ViewPatientBill from './pages/ViewPatientBill';
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
import ProtectedRoute from "./components/ProtectedRoute";
import AuditMaster from './pages/AuditMaster';
import DailyEarnings from './pages/DailyEarnings';
import OTP from './pages/OTP';

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
          <Route path="/user-list" element={<UserList />} />
          <Route path="/new-user" element={<Newuser />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/doctor" element={<Doctor />} />
          <Route path="/newdoctor" element={<NewDoctorPopUp />} />
          <Route path="/new-doctor" element={<NewDoctorPopUp />} />
          <Route path="/patient" element={<NewPatient />} />
          <Route path="/registration" element={<Registration />} />
          <Route path="/test" element={<Test />} />
          <Route path="/result" element={<Result />} />
          <Route path="/pdf" element={<PDF />} />
          <Route path="/doctor-wise-reg" element={<DoctorWiseRegistration />} />
          <Route path="/patient-state-wise" element={<PatientReportStateWise />} />
          <Route path="/dept-test-doc" element={<DeptTestDocFees />} />
          <Route path="/dept-doc" element={<DeptDocFees />} />
          <Route path="/referral-doc" element={<ReferralDocReport />} />
          <Route path="/consultation" element={<DoctorConsultation />} />
          <Route path="/medical-item" element={<MedicalItem />} />
          <Route path="/service" element={<PatientCharge />} />
          <Route path="/admission" element={<Admission />} />
          <Route path="/appointment" element={<Appointment />} />
          <Route path="/view-bills" element={<PatientsForBill />} />
          <Route path="/payment" element={<PayBillBefore />} />
          <Route path="/chart" element={<Charts />} />
          <Route path="/prescription" element={<Prescription />} />
          <Route path="/lab-test-master" element={<LabTestMaster />} />
          <Route path="/location-master" element={<LocationMaster />} />
          <Route path="/pharmacy-item-master" element={<PharmacyItemMaster />} />
          <Route path="/facility-master" element={<FacilityMaster />} />
          <Route path="/doctor-master" element={<DoctorMaster />} />
          <Route path="/audit-master" element={<AuditMaster />} />
          <Route path="/daily-earnings" element={<DailyEarnings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
