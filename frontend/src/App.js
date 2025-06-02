import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
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

function Layout({ children }) {
  return (
    <div className="flex">
        <Sidebar/>
      <div className="flex-1 p-4">
        <Breadcrumb />
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="*" element={
          <Layout>
            <Routes>
              <Route path="/home" element={<Home />} />
              <Route path="/userlist" element={<UserList />} />
              <Route path="/newuser" element={<Newuser />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/changePassword" element={<ChangePassword />} />
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
              <Route path="/docConsultation" element={<DoctorConsultation />} />
              <Route path="/medicalItem" element={<MedicalItem />} />
              <Route path="/patientCharge" element={<PatientCharge />} />
              <Route path="/admission" element={<Admission />} />
              <Route path="/appointment" element={<Appointment />} />
              <Route path="/viewPatientBill" element={<PayBillBefore />} />
              <Route path="/viewPDFBill" element={<PayBillBefore />} />
              <Route path="/chart" element={<Charts />} />
              <Route path="/prescription" element={<Prescription />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

export default App;
