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

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});