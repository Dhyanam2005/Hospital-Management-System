import { faUserDoctor } from '@fortawesome/free-solid-svg-icons';
import { faHospitalUser } from '@fortawesome/free-solid-svg-icons';
import { faTable } from '@fortawesome/free-solid-svg-icons';
import { faKitMedical } from '@fortawesome/free-solid-svg-icons';
import { faMoneyBill } from '@fortawesome/free-solid-svg-icons';
import { faFileAlt ,faUser } from '@fortawesome/free-solid-svg-icons';

const sidebarMenu = [
  {
    title: "User",
    submenu: [
      { label: "New User", link: "/new-user" },
      { label: "User List", link: "/user-list" },
    ],
    icon : faUser
  },
  {
    title: "Master",
    submenu: [
      { label: "Location Master", link: "/location-master" },
      { label: "Lab Test Master", link: "/lab-test-master" },
      { label: "Pharmacy Item Master", link: "/pharmacy-item-master" },
      { label: "Facility Master", link: "/facility-master" },
      { label: "Doctor Master", link: "/doctor-master" },
      { label: "Import data", link: "/import-file" },
    ],
    icon : faTable
  },
  {
    title: "Patient",
    submenu: [
      { label: "New Patient", link: "/patient" },
      { label: "Patient Registration", link: "/registration" },
      { label: "Patient Admission", link: "/admission" },
    ],
    icon : faHospitalUser
  },
  {
    title: "Clinical Services",
    submenu: [
      { label: "Test", link: "/test" },
      { label: "Test Results", link: "/result" },
      { label: "Pharmacy Items", link: "/medical-item" },
      { label: "Service", link: "/service" },
      { label : "Appointment ", link : "/appointment"},
    ],
    icon : faKitMedical
  },
  {
    title: "Doctor",
    submenu: [
      { label: "New Doctor", link: "/new-doctor" },
      { label: "Doctor Consultations", link: "/consultation" },
      { label: "Prescriptions", link: "/prescription" },
      { label : "Appointments" , link : "/appointment"},
    ],
    icon : faUserDoctor
  },
  {
    title: "Billing",
    submenu: [
      { label: "View Bills", link: "/view-bills" },
      { label: "Record Payment", link: "/payment" },
    ],
    icon : faMoneyBill
  },
  {
    title : "Reports",
    submenu : [{
      label : "Tabular",
      submenu : [
          { label: "Patient Statewise", link: "/patient-state-wise" },
          { label: "Doctor Collection", link: "/doctor-wise-reg" },
          { label: "Lab Performance", link: "/dept-test-doc" },
          { label: "Referral Doctor Summary", link: "/referral-doc" },
          { label: "Doctor Test Collection", link: "/dept-doc" },
          { label : "Audit Log",link : "/audit-master"},
          { label : "Daily Collection",link : "/daily-earnings"},
      ]
    },
    {label : "Charts" , link : "/chart"}
  ],
    icon : faFileAlt
  }
];

export default sidebarMenu;