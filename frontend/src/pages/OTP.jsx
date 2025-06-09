import React, { useState } from "react";
import { useNavigate } from 'react-router-dom'; 

import axios from "axios";

function OTP() {
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();
  const handleVerify = async () => {
    console.log(userId+" "+otp)
    try {
      const res = await axios.post("http://localhost:3000/verify-otp", {
        userId,
        otp,
      });
      setMessage("Verified! Token: " + res.data.token);
      localStorage.setItem('token',res.data.token);
      localStorage.removeItem('userId');
      navigate("/");
    } catch (err) {
      setMessage("Error: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div>
      <h2>Enter OTP</h2>
      <input
        type="text"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        placeholder="Enter OTP"
      />
      <button onClick={handleVerify}>Verify OTP</button>
      <p>{message}</p>
    </div>
  );
}

export default OTP;
