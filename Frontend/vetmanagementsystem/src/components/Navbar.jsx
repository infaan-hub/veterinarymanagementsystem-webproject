import React from "react";
import { Link } from "react-router-dom";

export default function Navbar({ role }) {
  return (
    <nav className="topbar">
      <h2>Veterinary Management System</h2>
      <div className="form-actions">
        {role === "doctor" ? (
          <>
            <Link to="/doctor-dashboard">Dashboard</Link>
            <Link to="/vitals">Vitals</Link>
            <Link to="/medications">Medications</Link>
            <Link to="/treatments">Treatment</Link>
            <Link to="/documents">Documents</Link>
          </>
        ) : (
          <>
            <Link to="/customer-dashboard">Dashboard</Link>
            <Link to="/appointments">Appointments</Link>
            <Link to="/patients">Patients</Link>
          </>
        )}
        <Link to="/overview">Overview</Link>
        <Link to="/logout">Logout</Link>
      </div>
    </nav>
  );
}
