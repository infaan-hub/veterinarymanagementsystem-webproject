import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getRole, logout } from "../utils/auth";

export default function TopMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const role = getRole();
  const loggedIn = Boolean(role);

  useEffect(() => {
    function handleClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  function handleLogout() {
    setOpen(false);
    logout(role || "");
    navigate(role === "doctor" ? "/doctor/login" : "/login");
  }

  return (
    <div className="top-menu" ref={menuRef}>
      <button className="top-menu-button" type="button" onClick={() => setOpen((value) => !value)}>
        <span></span>
        <span></span>
        <span></span>
      </button>
      <div className={`top-menu-panel ${open ? "open" : ""}`}>
        {loggedIn ? (
          <button className="top-menu-link" type="button" onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <>
            <Link className="top-menu-link" to="/login" onClick={() => setOpen(false)}>
              Customer Login
            </Link>
            <Link className="top-menu-link" to="/register" onClick={() => setOpen(false)}>
              Customer Register
            </Link>
            <Link className="top-menu-link" to="/doctor/login" onClick={() => setOpen(false)}>
              Doctor Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
