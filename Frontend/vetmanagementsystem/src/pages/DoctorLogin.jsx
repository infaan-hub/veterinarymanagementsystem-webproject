import React, { useState } from "react";
import API, { setTokens } from "../api";
import { useNavigate } from "react-router-dom";
import { setRole } from "../utils/auth";

export default function DoctorLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/doctor/login/", form);

      if (!res.data?.access || !res.data?.refresh) {
        throw new Error("Token response is missing access/refresh fields.");
      }

      setTokens(res.data.access, res.data.refresh);

      const role = res.data.user?.role || "doctor";
      setRole(role);
      localStorage.setItem("username", res.data.user?.username || form.username);
      if (res.data.user?.email) {
        localStorage.setItem("email", res.data.user.email);
      }

      navigate("/doctor-dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>
          Veterinary Management System Doctor Login
        </h1>
        <p className="page-desc">
          Enter your credentials to access your account
        </p>

        {error ? <p className="status-msg">{error}</p> : null}

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            value={form.username}
            onChange={handleChange}
            required
            className="auth-input"
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            name="password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            required
            className="auth-input"
          />

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth-switch">
          Go back to{" "}
          <button type="button" className="auth-switch-link" onClick={() => navigate("/login")}>
            Customer Login
          </button>
        </p>
      </div>
    </div>
  );
}
