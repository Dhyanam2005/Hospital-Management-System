import { faUserShield }   from '@fortawesome/free-solid-svg-icons';
import { faTable }        from '@fortawesome/free-solid-svg-icons';
import { faHospitalUser } from '@fortawesome/free-solid-svg-icons';
import { faKitMedical }   from '@fortawesome/free-solid-svg-icons';
import { faUserDoctor }   from '@fortawesome/free-solid-svg-icons';
import { faMoneyBill }    from '@fortawesome/free-solid-svg-icons';
import { faFileAlt }      from '@fortawesome/free-solid-svg-icons';

const menuIconMap = {
  SECURITY: faUserShield,  // renamed from USER
  MASTER:   faTable,
  PATIENT:  faHospitalUser,
  CLINICAL: faKitMedical,
  DOCTOR:   faUserDoctor,
  BILLING:  faMoneyBill,
  REPORTS:  faFileAlt,
};

export default menuIconMap;
