import React, { useEffect, useMemo, useState } from "react";
import API from "../api";

export default function Appointments() {
  const [clients, setClients] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    client: "",
    patient: "",
    date: "",
    location: "",
    reason: "",
  });

  useEffect(() => {
    loadClients();
    loadPatients();
    loadAppointments();
  }, []);

  function toList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  }

  async function loadClients() {
    try {
      const res = await API.get("/clients/");
      setClients(toList(res.data));
    } catch (_err) {}
  }

  async function loadPatients() {
    try {
      const res = await API.get("/patients/");
      setPatients(toList(res.data));
    } catch (_err) {}
  }

  async function loadAppointments() {
    try {
      const res = await API.get("/appointments/");
      setAppointments(toList(res.data));
    } catch (_err) {
      setStatus("Could not load appointments");
    }
  }

  const filteredPatients = useMemo(() => {
    if (!form.client) return [];
    return patients.filter((patient) => String(patient.client?.id ?? patient.client) === String(form.client));
  }, [patients, form.client]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function clearForm() {
    setEditingId(null);
    setForm({ client: "", patient: "", date: "", location: "", reason: "" });
  }

  function startEdit(appointment) {
    setEditingId(appointment.id);
    setForm({
      client: String(appointment.client?.id ?? appointment.client ?? ""),
      patient: String(appointment.patient?.id ?? appointment.patient ?? ""),
      date: appointment.date ? String(appointment.date).slice(0, 16) : "",
      location: appointment.location || "",
      reason: appointment.reason || "",
    });
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this appointment?")) return;
    try {
      await API.delete(`/appointments/${id}/`);
      if (editingId === id) clearForm();
      setStatus("Appointment deleted");
      await loadAppointments();
    } catch (_err) {
      setStatus("Failed to delete appointment");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.client || !form.patient || !form.date) {
      setStatus("Client, patient and date are required");
      return;
    }

    const payload = {
      client: form.client,
      patient: form.patient,
      date: form.date,
      location: form.location,
      reason: form.reason,
    };

    try {
      if (editingId) {
        await API.patch(`/appointments/${editingId}/`, payload);
        setStatus("Appointment updated");
      } else {
        await API.post("/appointments/", payload);
        setStatus("Appointment added");
      }
      clearForm();
      await loadAppointments();
    } catch (_err) {
      setStatus("Failed to save appointment");
    }
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Veterinary Management System Customer Panel</h2>
        <nav className="nav">
          <a href="/customer-dashboard">Dashboard</a>
          <a className="active" href="/appointments">
            Appointments
          </a>
          <a href="/patients">Patients</a>
          <a href="/overview">Overview</a>
        </nav>
      </aside>

      <main className="main">
        <section className="hero">
          <h1>Appointments</h1>
          <p className="page-desc">Plan visits with clear details, including the location.</p>
        </section>

        <section className="form-card">
          <form onSubmit={handleSubmit}>
            <div className="field-grid">
              <div className="field-full">
                <label>Client</label>
                <select name="client" value={form.client} onChange={handleChange} required>
                  <option value="">Select client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.full_name || client.username || client.id}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field-full">
                <label>Patient</label>
                <select name="patient" value={form.patient} onChange={handleChange} required>
                  <option value="">Select patient</option>
                  {filteredPatients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name || patient.id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Date & Time</label>
                <input type="datetime-local" name="date" value={form.date} onChange={handleChange} required />
              </div>
              <div>
                <label>Location</label>
                <input name="location" value={form.location} onChange={handleChange} placeholder="Appointment location" />
              </div>
              <div className="field-full">
                <label>Reason</label>
                <textarea name="reason" value={form.reason} onChange={handleChange} placeholder="Reason" />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="action-btn">
                {editingId ? "Update Appointment" : "Add Appointment"}
              </button>
              {editingId ? (
                <button type="button" className="secondary-btn" onClick={clearForm}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
          <p className="status-msg">{status}</p>
        </section>

        <section className="record-list">
          {appointments.map((appointment) => (
            <article key={appointment.id} className="record-card">
              <strong>{appointment.patient_name || appointment.patient}</strong>
              <p>{appointment.date}</p>
              <p>Location: {appointment.location || "-"}</p>
              <p>{appointment.reason || "-"}</p>
              <div className="form-actions">
                <button type="button" className="action-btn" onClick={() => startEdit(appointment)}>
                  Edit
                </button>
                <button type="button" className="action-btn" onClick={() => handleDelete(appointment.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
