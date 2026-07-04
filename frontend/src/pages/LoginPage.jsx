import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import API_BASE_URL from '../apiConfig';
import AppointmentChatbot from '../components/AppointmentChatbot';

function Login() {
  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [loading, setLoading]         = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_name: username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('expiry', data.password_expiry_days * 86400000);
        localStorage.setItem('last_logged', data.updated_at);
        navigate('/otp', {
          state: {
            userId     : data.userId,
            expiry     : data.password_expiry_days * 86400000,
            last_logged: data.updated_at,
          },
        });
      } else {
        setErrorMessage(data.message);
      }
    } catch {
      setErrorMessage('Service Error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="container">

        {/* Hospital brand */}
        <div className="login-brand">
          <div className="login-brand-icon">🏥</div>
          <div className="login-brand-name">City General Hospital</div>
          <div className="login-brand-tagline">Hospital Management System</div>
        </div>

        {/* Error banner */}
        {errorMessage && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c',
            padding: '10px 16px', borderRadius: 8, marginBottom: 16,
            fontSize: 13, fontWeight: 500, maxWidth: 400, width: '100%',
            textAlign: 'center', position: 'relative', zIndex: 1,
          }}>
            {errorMessage}
          </div>
        )}

        {/* Login card */}
        <form onSubmit={handleLogin} className="login-form">
          <h1>Staff Login</h1>
          <p style={{ fontSize: 13, color: '#475569', marginTop: 4, marginBottom: 24 }}>
            Sign in to access the management portal
          </p>

          <div>
            <label htmlFor="username" style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block' }}>
              Username
            </label>
            <input
              id="username" type="text" placeholder="Enter your username"
              value={username} onChange={e => setUsername(e.target.value)}
              required autoComplete="username"
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <label htmlFor="password" style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block' }}>
              Password
            </label>
            <input
              id="password" type="password" placeholder="Enter your password"
              value={password} onChange={e => setPassword(e.target.value)}
              required autoComplete="current-password"
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <div className="login-divider">Patient Portal</div>

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>
              Not a staff member? Book an appointment online.
            </p>
            <button
              type="button"
              onClick={() => setChatbotOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #0891b2, #0e7490)',
                color: '#fff', border: 'none', borderRadius: 8,
                padding: '10px 22px', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
                gap: 8, boxShadow: '0 3px 10px rgba(8,145,178,0.35)',
                transition: 'box-shadow 0.2s',
              }}
            >
              🩺 Book an Appointment
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: 11, color: '#cbd5e1', marginTop: 24, marginBottom: 0 }}>
            © {new Date().getFullYear()} City General Hospital · All rights reserved
          </p>
        </form>
      </div>

      {chatbotOpen && <AppointmentChatbot onClose={() => setChatbotOpen(false)} />}
    </>
  );
}

export default Login;
