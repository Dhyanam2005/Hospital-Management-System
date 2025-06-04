import React, { useState } from 'react';
import './ChangePassword.css';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/SidebarMenu';


function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try{
        const res = await fetch('http://localhost:3000/changepassword',{
            method : 'POST',
            headers : { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ oldPassword, newPassword , confirmPassword }),
        })

        const data = await res.json();

        if(res.ok){
            console.log("Password changed");
            navigate("/home");
        }else{
            setErrorMessage(data.errorMessage || 'Invalid Credentials')
        }
    }catch(err){
        console.log("Error exists huh")
    }
  };

  return (
        <div>
            <div className="change-password-container ml-[20%]">
            {errorMessage && (
                <div className="mt-5 p-3 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded w-72 text-center mt-2 mx-auto block">
                    {errorMessage}
                </div>
            )}
            <h1 className='title text-3xl bold block text-center mb-6'>Change Password</h1>
            <form onSubmit={handleChangePassword} className="flex flex-col items-center space-y-4 mt-6" >
                <div className="flex flex-col items-center space-y-2">
                    <label htmlFor="oldPassword" className="text-gray-700 font-medium">Enter your old password</label>
                    <input
                        id="oldPassword"
                        type="password"
                        placeholder="Enter Old password"
                        className="p-3 w-72 border border-gray-300 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                    />
                </div>

                <div className="flex flex-col items-center space-y-2">
                    <label htmlFor="newPassword" className="text-gray-700 font-medium">Enter your new Password</label>
                    <input
                        id="newPassword"
                        type="password"
                        placeholder="Enter Password"
                        className="p-3 w-72 border border-gray-300 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                </div>

                <div className="flex flex-col items-center space-y-2">
                    <label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirm your new Password</label>
                    <input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm Password"
                        className="p-3 w-72 border border-gray-300 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>
                <button type="submit" className="mt-7 mx-auto change-password">Change Password</button>
            </form>
    </div>
        </div>
  );
}

export default ChangePassword;
