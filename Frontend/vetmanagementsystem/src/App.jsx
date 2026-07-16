import React from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import TopMenu from "./components/TopMenu";
import { getRole } from "./utils/auth";

import Appointments from "./pages/Appointments";
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerOverview from "./pages/CustomerOverview";
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorLogin from "./pages/DoctorLogin";
import DoctorOverview from "./pages/DoctorOverview";
import Documents from "./pages/Documents";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Logout from "./pages/Logout";
import Medications from "./pages/Medications";
import Patients from "./pages/Patients";
import Register from "./pages/Register";
import Treatments from "./pages/Treatments";
import Vitals from "./pages/Vitals";

function Overview() {
  const role = getRole();

  if (role === "doctor") return <DoctorOverview />;
  if (role === "customer") return <CustomerOverview />;

  return <Navigate to="/home" replace />;
}

function PrivateRoute({ children, allowedRoles }) {
  const role = getRole();
  const loginPath = allowedRoles.includes("doctor") && allowedRoles.length === 1 ? "/doctor/login" : "/login";

  if (!role) {
    return <Navigate to={loginPath} replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={role === "doctor" ? "/doctor-dashboard" : "/customer-dashboard"} replace />;
  }

  return children;
}

export default function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/doctor/login" element={<DoctorLogin />} />
        <Route path="/doctor" element={<Navigate to="/doctor-dashboard" replace />} />
        <Route
          path="/doctor-dashboard"
          element={
            <PrivateRoute allowedRoles={["doctor"]}>
              <DoctorDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/patients"
          element={
            <PrivateRoute allowedRoles={["customer"]}>
              <Patients />
            </PrivateRoute>
          }
        />
        <Route
          path="/appointments"
          element={
            <PrivateRoute allowedRoles={["customer"]}>
              <Appointments />
            </PrivateRoute>
          }
        />
        <Route
          path="/vitals"
          element={
            <PrivateRoute allowedRoles={["doctor"]}>
              <Vitals />
            </PrivateRoute>
          }
        />
        <Route
          path="/medications"
          element={
            <PrivateRoute allowedRoles={["doctor"]}>
              <Medications />
            </PrivateRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <PrivateRoute allowedRoles={["doctor"]}>
              <Documents />
            </PrivateRoute>
          }
        />
        <Route
          path="/treatments"
          element={
            <PrivateRoute allowedRoles={["doctor"]}>
              <Treatments />
            </PrivateRoute>
          }
        />
        <Route
          path="/customer-dashboard"
          element={
            <PrivateRoute allowedRoles={["customer"]}>
              <CustomerDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/overview"
          element={
            <PrivateRoute allowedRoles={["doctor", "customer"]}>
              <Overview />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
      <TopMenu />
    </Router>
  );
}
