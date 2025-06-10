import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";

function ProfileButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <FontAwesomeIcon icon={faUser} className="w-5 h-5" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg z-10">
          <a href="/profile" className="block px-4 py-2 hover:bg-gray-100">
            Profile
          </a>
          <a href="/change-password" className="block px-4 py-2 hover:bg-gray-100">
            Change Password
          </a>
          <a href="/login" onClick={() => localStorage.removeItem("token")} className="block px-4 py-2 hover:bg-gray-100">
            Logout
          </a>
        </div>
      )}
    </div>
  );
}

export default ProfileButton;
