require('dotenv').config();

const express = require('express');
const cors = require('cors');
const registerForHashingRouter = require("./routes/registerForHashing");
const loginRouter = require("./routes/auth")
const userRouter = require("./routes/userRouter")
const newUserRouter = require("./routes/createAuth")
const profileRouter = require("./routes/profile");
const changePassWordRouter = require("./routes/changePassWord");
const doctorRouter = require("./routes/doctor");
const specializationRouter = require("./routes/specialization");
const newPatientRouter = require("./routes/createPatient");
const cityGetRouter = require("./routes/getCities");
const referredDoctors = require("./routes/getRefferedBy");
const fetchPatientRouter = require("./routes/fetchPatient");
const fetchInHouseDoctorsRouter = require("./routes/fetchInHouseDoctors");
const registrationRouter = require("./routes/registration");
const fetchTestsRouter = require("./routes/fetchTests");
const saveTestGridDataRouter = require("./routes/saveTestGridData");
const fetchResultsRouter = require("./routes/fetchResults");
const postResultRouter = require("./routes/postingResults");
const getPatientDetailsRouter = require("./routes/getPatientDetailsPDF");
const getTestDetailRouter = require("./routes/getTestsPDF");
const getReportQueriesRouter = require("./routes/reportQueries");
const getDocConsultationRouter = require("./routes/docConsultation");
const fetchPatientsRegistrationRouter = require("./routes/fetchPatientsRegistration");
const retriveConsultationRouter = require("./routes/retrieveConsultation");
const retrieveMedicalItemRouter = require("./routes/retrieveMedicalItem");
const retrievePatientRouter = require("./routes/retrievePatientCharge");
const getAdmissionRouter = require("./routes/getAdmission");
const getAppointmentsRouter = require("./routes/getAppointments");
const getPatientBillRouter = require("./routes/getPatientBill");
const getPayBillRouter = require("./routes/payBill");
const chartRouter = require("./routes/charts");
const prescriptionRouter = require("./routes/prescription");
const masterDataRouter = require("./routes/masterData");
const regStatusRouter = require("./routes/reg_status");
const importMasterDataRouter = require("./routes/import");
const razorPayRouter = require("./routes/razorpay");
const documentMasterRouter = require("./routes/documentMaster");
const patientDocumentsRouter = require("./routes/patientDocuments");
const menuRouter = require("./routes/menu");
const roleManagementRouter = require("./routes/roleManagement");
const rolePermissionsRouter = require("./routes/rolePermissions");
const userRoleMappingRouter = require("./routes/userRoleMapping");
const loginAuditRouter = require("./routes/loginAudit");
const chatbotRouter = require("./routes/chatbot");
const patientTimelineRouter = require("./routes/patientTimeline");
const medicalCertificateRouter = require("./routes/medicalCertificate");
const queueRouter = require("./routes/queue");
const notificationsRouter = require("./routes/notifications");

const app = express();

const PORT = process.env.PORT || 3000;
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors(corsOptions));
app.use(express.json());



app.use("/",razorPayRouter);
app.use("/",menuRouter);
app.use("/",roleManagementRouter);
app.use("/",rolePermissionsRouter);
app.use("/",userRoleMappingRouter);
app.use("/",loginAuditRouter);
app.use("/",chatbotRouter);
app.use("/",patientTimelineRouter);
app.use("/",medicalCertificateRouter);
app.use("/",queueRouter);
app.use("/",notificationsRouter);
app.use("/",documentMasterRouter);
app.use("/",patientDocumentsRouter);
app.use("/",importMasterDataRouter);
app.use("/",regStatusRouter);
app.use("/",masterDataRouter);
app.use("/",registerForHashingRouter);
app.use("/",prescriptionRouter);
app.use("/",chartRouter);
app.use("/",getPayBillRouter);
app.use("/",getPatientBillRouter);
app.use("/",getAppointmentsRouter);
app.use("/",getAdmissionRouter);
app.use("/",retrievePatientRouter);
app.use("/",retrieveMedicalItemRouter)
app.use("/",retriveConsultationRouter);
app.use("/",fetchPatientsRegistrationRouter);
app.use("/",getDocConsultationRouter);
app.use("/",getReportQueriesRouter);
app.use("/",getTestDetailRouter);
app.use("/",getPatientDetailsRouter);
app.use("/",postResultRouter);
app.use("/",fetchResultsRouter);
app.use("/",saveTestGridDataRouter);
app.use("/",fetchTestsRouter);
app.use("/",cityGetRouter);
app.use("/",registrationRouter);
app.use("/",fetchInHouseDoctorsRouter);
app.use("/",fetchPatientRouter);
app.use("/", referredDoctors);
app.use("/",newPatientRouter);
app.use("/",specializationRouter);
app.use('/',profileRouter);
app.use("/",changePassWordRouter);
app.use('/',loginRouter);
app.use('/',newUserRouter);
app.use('/',userRouter);
app.use("/",doctorRouter);


app.get('/', (req, res) => {
  res.send('Backend is running!');
});

module.exports = app;