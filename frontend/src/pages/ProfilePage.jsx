import React , { use, useEffect, useState} from 'react';
import "./ProfilePage.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import Navbar from '../components/SidebarMenu';



function ProfilePage(){

    const check = {
        1 : "Admin",
        2: "Doctor",
        3: "Operator"
    };

    const [user,setUser] = useState(null);
    const [errorMessage,setErrorMessage] = useState('');
    useEffect(() => {
        const token = localStorage.getItem('token');
        if(!token){
            setErrorMessage('No token found.Please log-in');
            return;
        }

    axios.get('http://localhost:3000/user', {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    })
    .then((response) => setUser(response.data))
    .catch((err) => setErrorMessage("Error in fetching data"));
    },[]);


    return(
        <div>
            <div className='profile-page ml-[20%]'>
            <div className="title-container">
                <h1 className='bold text-3xl block text-center'>Profile Page</h1>
            </div>
            <FontAwesomeIcon icon={faUser} className='text-7xl mx-auto block mt-7'/>
            {errorMessage && <p className="text-red-600 text-center mt-4">{errorMessage}</p>}
            {user ? (
        <div className="user-info text-center mt-6">
            <p><strong>UserID:</strong> {user.user_id}</p>
            <p><strong>UserName:</strong> {user.user_name}</p>
            <p><strong>Type:</strong> {check[user.user_type]}</p>
        </div>
      ) : !errorMessage ? (
        <p className="text-center mt-4">Loading...</p>
      ) : null}
        </div>
        </div>
    )
}

export default ProfilePage;