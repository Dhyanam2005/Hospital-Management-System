import React from 'react';
import { useNavigate } from 'react-router-dom';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 ml-[20%]">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-red-600 mb-4">404</h1>
        <p className="text-xl text-gray-700 mb-6">Oops! Page not found.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}

export default NotFound;