import React, { useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

export default function CustomerRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      try {
        await API.post("/client/register/", form);
      } catch (err) {
        if (err?.response?.status === 404) {
          await API.post("/register/", form);
        } else {
          throw err;
        }
      }
      navigate("/login");
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.username?.[0] ||
        err?.response?.data?.email?.[0] ||
        err?.response?.data?.password?.[0] ||
        err?.response?.data?.phone?.[0] ||
        err?.response?.data?.address?.[0] ||
        err?.message;
      setError(detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-root">
      <div className="auth-card">
        <h1>Customer Registration</h1>
        <p className="page-desc">Create a customer account.</p>

        {error ? <p className="status-msg">{error}</p> : null}

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="full_name">Full Name</label>
          <input id="full_name" name="full_name" value={form.full_name} onChange={handleChange} required />

          <label htmlFor="username">Username</label>
          <input id="username" name="username" value={form.username} onChange={handleChange} required />

          <label htmlFor="email">Email</label>
          <input id="email" type="email" name="email" value={form.email} onChange={handleChange} required />

          <label htmlFor="password">Password</label>
          <input id="password" type="password" name="password" value={form.password} onChange={handleChange} required />

          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" value={form.phone} onChange={handleChange} />

          <label htmlFor="address">Address</label>
          <textarea id="address" name="address" value={form.address} onChange={handleChange} />

          <button type="submit" className="action-btn" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}
