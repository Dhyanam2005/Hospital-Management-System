import React, { useState } from "react";
import { useNavigate } from 'react-router-dom'; 
import axios from "axios";

function OTP() {
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const userId = localStorage.getItem('userId');
  const expiry = localStorage.getItem('expiry');
  const last_logged = localStorage.getItem('last_logged');
  const navigate = useNavigate();

  const handleVerify = async () => {
    try {
      const res = await axios.post("http://localhost:3000/verify-otp", {
        userId,
        otp,
      });
      setMessage("Verified! Token: " + res.data.token);
      localStorage.setItem('token', res.data.token);
      localStorage.removeItem('userId');
      if (new Date(expiry + last_logged) > new Date()) {
        navigate("/change-password");
      } else {
        navigate("/");
      }
    } catch (err) {
      setMessage("Error: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="max-w-sm w-full p-6 bg-white shadow-lg rounded-lg">
        <h2 className="font-bold text-3xl text-center mb-4">Enter OTP</h2>
        <input
          type="text"
          className="w-full p-2 mb-4 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="OTP"
        />
        <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleVerify}>
          Verify OTP
        </button>
        {message && <p className="mt-4 text-center text-sm text-red-600">{message}</p>}
      </div>
    </div>
  );
}

export default OTP;
