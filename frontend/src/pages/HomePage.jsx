import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css'; // Optional styling file
import Navbar from '../components/SidebarMenu';

function HomePage() {
    return (
        <div className="home-page">
            <Navbar/>
            
        </div>
    );
}

export default HomePage;
