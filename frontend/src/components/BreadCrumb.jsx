import React from "react";
import { Link, useLocation } from 'react-router-dom';

const pathLabels = {
  home: 'Home',
  doctor: 'Doctor Master',
  'new-doctor': 'New Doctor',
  patient: 'New Patient',
  registration: 'Patient Registration',
  admission: 'Patient Admission',
  test: 'Test',
  result: 'Test Results',
  pdf: 'PDF Report',
  'doctor-wise-reg': 'Doctor Collection',
  'patient-state-wise': 'Patient Statewise',
  'dept-test-doc': 'Lab Performance',
  'dept-doc': 'Doctor Test Collection',
  'referral-doc': 'Referral Doctor Summary',
  docConsultation: 'Doctor Consultations',
  medicalItem: 'Pharmacy Items',
  patientCharge: 'Patient Charges',
  appointment: 'Appointments',
  viewPatientBill: 'Patient Bill',
  viewPDFBill: 'Record Payment',
  chart: 'Charts',
  prescription: 'Prescriptions',
  profile: 'Profile',
};

function BreadCrumb(){
    const location = useLocation();
    const segments = location.pathname.split('/').filter(Boolean);

    if(segments.length == 0) return null;

    return(
        <nav className="text-sm text-gray-500 my-2 ml-[20%]">
    <ol className="list-reset flex">
        <li>
          <Link to="/" className="hover:text-blue-500">Home</Link>
          {segments.length > 0 && <span className="mx-2">/</span>}
        </li>

        {segments.map((segment, index) => {
          const path = '/' + segments.slice(0, index + 1).join('/');

          const formattedLabel = segment
            .replace(/-/g, ' ')         // "doctor-wise-reg" → "doctor wise reg"
            .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letters

          return (
            <li key={index}>
              <Link to={path} className="hover:text-blue-500">
                {formattedLabel}
              </Link>
              {index < segments.length - 1 && <span className="mx-2">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
    )
}

export default BreadCrumb