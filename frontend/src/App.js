import React from 'react';
import {BrowserRouter as Router,Route,Routes} from 'react-router-dom';
import Login from './pages/LoginPage';
import Home from "./pages/HomePage"
import UserList from './pages/UserList';
import Newuser  from './pages/NewUser';
import ProfilePage from "./pages/ProfilePage"
import ChangePassword from './pages/ChangePassword';
import Doctor from './pages/Doctor';
import NewDoctorPopUp from './pages/NewDoctorPopUp';
import NewPatient from './pages/NewPatient';
import Registration from './pages/Registration';

function App() {
    return(
        <Router>
            <Routes>
                <Route path='/login' element={<Login />}/>
                <Route path='/home' element={<Home />}/>
                <Route path='/userlist' element={<UserList />}/>
                <Route path='/newuser' element={<Newuser />}/>
                <Route path='/profile' element={<ProfilePage />}/>
                <Route path='/changePassword' element={<ChangePassword />}/>
                <Route path='/doctor' element={<Doctor />}/>
                <Route path='/newdoctor' element={<NewDoctorPopUp />}/>
                <Route path='/patient' element={<NewPatient />}/>
                <Route path='/registration' element={<Registration />}/>
            </Routes>
        </Router>
    )
}

export default App;