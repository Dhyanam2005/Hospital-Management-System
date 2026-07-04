// Controls which leaf MENU_CODEs are visible per role in the sidebar.
// Role 1 (admin) sees everything — no entry needed.
// Parent nodes are shown automatically when they have at least one visible child.
const allowedMenuCodesByRole = {
  1: 'ALL',
  2: [
    'DOCTOR_CONSULTATION',
    'DOCTOR_PRESCRIPTION',
    'DOCTOR_APPOINTMENT',
  ],
  3: [
    'DOCTOR_CONSULTATION',
    'CLINICAL_TEST',
    'CLINICAL_TEST_RESULTS',
    'CLINICAL_SERVICE',
    'CLINICAL_APPOINTMENT',
  ],
};

export default allowedMenuCodesByRole;
