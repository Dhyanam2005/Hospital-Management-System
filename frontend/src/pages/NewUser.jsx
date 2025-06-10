import React, { useState } from 'react';
import "./NewUser.css"
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/SidebarMenu';
import API_BASE_URL from '../apiConfig';


function Newuser() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirm_password, setConfirmpassword] = useState('');
    const [type, setUsertype] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const navigate = useNavigate();

    const handleSubmitNewUser = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch(`${API_BASE_URL}/newuser`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, confirm_password, type }),
            })

            const data = await res.json();

            if (res.ok) {
                navigate('/');
            } else {
                setErrorMessage(data.message);
            }
        } catch (err) {
            setErrorMessage('Service Error');
        }
    }

    return (
        <div className='ml-[20%]'>
            <div className='newuser'>
            {errorMessage && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded w-72 text-center mb-4 mx-auto block">
                    {errorMessage}
                </div>
            )}

            <h1 className="text-2xl font-bold mb-4 block text-center">Create a New User</h1>
            <form onSubmit={handleSubmitNewUser} className="flex flex-col items-center space-y-4 mt-6" >
                <div className="flex flex-col items-center space-y-2">
                    <label htmlFor="username" className="text-gray-700 font-medium">Username</label>
                    <input
                        id="username"
                        type="text"
                        placeholder="Enter Username"
                        className="p-3 w-72 border border-gray-300 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>

                <div className="flex flex-col items-center space-y-2">
                    <label htmlFor="password" className="text-gray-700 font-medium">Password</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="Enter Password"
                        className="p-3 w-72 border border-gray-300 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div className="flex flex-col items-center space-y-2">
                    <label htmlFor="confirm_password" className="text-gray-700 font-medium">Confirm Password</label>
                    <input
                        id="confirm_password"
                        type="password"
                        placeholder="Confirm Password"
                        className="p-3 w-72 border border-gray-300 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                        value={confirm_password}
                        onChange={(e) => setConfirmpassword(e.target.value)}
                    />
                </div>

                <div className="flex flex-col items-center space-y-2">
                    <label htmlFor="type" className="text-gray-700 font-medium">Select type</label>
                    <select
                        id="type"
                        className="w-36 rounded-lg p-3 mb-2"
                        value={type}
                        onChange={(e) => setUsertype(e.target.value)}
                    >
                        <option value="" disabled hidden>Select Role</option>
                        <option value="admin">Admin</option>
                        <option value="doctor">Doctor</option>
                        <option value="operator">Operator</option>
                    </select>
                </div>

                <button type="submit" className="mt-7 mx-auto block login-button">Create</button>
            </form>
        </div>
        </div>
    )
}

export default Newuser;
