import React , { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import "./LoginPage.css";
import API_BASE_URL from './apiConfig';


function Login (){
    const [username,setUsername] = useState('');
    const [password,setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        try{
            const res = await fetch(`${API_BASE_URL}/login`,{
                method : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            })

            const data = await res.json();

            if(res.ok){
                localStorage.setItem('token',data.token);
                navigate('/');
            }else{
                setErrorMessage('Invalid credentials');
            }
        }catch(err){
            setErrorMessage('Service Error');
        }
    }

    return(
        <div className='container'>
            {errorMessage && (
                <div className="mt-5 p-3 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded w-72 text-center mt-2 mx-auto block">
                    {errorMessage}
                </div>
            )}
            <form onSubmit={handleLogin} className="max-w-sm mx-auto p-6 shadow-lg rounded-lg login-form">
                <h1 className="font-bold text-3xl text-center">Login</h1>
                <div className="mt-8">
                    <label htmlFor = "username" className="block text-sm font-semibold text-gray-700">Username</label>
                    <input id = "username" className="w-full p-2 border-gray-300 rounded-lg placeholder-gray-400 placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-500" type='text' placeholder='Type your username' value={username} onChange={(e) => setUsername(e.target.value)}></input>
                </div>
                <div className="mt-6">
                    <label htmlFor = "password" className="block text-sm font-semibold text-gray-700">Password</label>
                    <input id = "password" className="w-full p-2 border-gray-300 rounded-lg placeholder-gray-400 placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-500" type='password' placeholder='Type your password' value={password} onChange={(e) => setPassword(e.target.value)}></input>
                </div>
                <button type='submit' className="mt-6 mx-auto block login-button">Login</button>
            </form>
        </div>
    )
}

export default Login;