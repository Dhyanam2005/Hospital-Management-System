import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import "./Navbar.css"


function Navbar() {

    const [menuOpen,setMenuOpen] = useState(false);
    const[profileIsOpen,setProfileIsOpen] = useState(false);

    return(
        <div className='home-page'>
            <nav className='navbar'>
                <div className="nav-links">
                    <a href = "/home">Home</a>
                    <a href="/userlist">User List</a>
                    <a href="/newuser">Create a New User</a>
                    <a href="/doctor">Display doctors</a>
                    <a href="/patient">Create Patient</a>
                    <a href="/registration">Registration</a>
                </div>
                <button className='profile-photo' onClick={() => setProfileIsOpen(!profileIsOpen)}>
                    <FontAwesomeIcon icon={faUser} className='icon-user'/>
                </button>
                {profileIsOpen && (
                    <div className='profile-links'>
                        <a href = "/profile" className='profile-ind-link'>Profile</a><br />
                        <a href = "/changepassword" className='profile-ind-link'>Change Password</a><br />
                        <a href = "/login" className='profile-ind-link'
                        onClick={(e) => {
                            e.preventDefault();
                            localStorage.removeItem('token');
                            window.location.href = '/login';
                        }}>Logout</a>
                    </div>
                )}
            </nav>
        </div>
    )
}

export default Navbar;
