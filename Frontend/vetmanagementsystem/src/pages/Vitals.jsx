import React, { useEffect, useState } from "react";
import API from "../api";

export default function Vitals() {
  const [patients, setPatients] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    patient: "",
    temperature: "",
    heart_rate: "",
    respiration: "",
    weight_lbs: "",
  });

  useEffect(() => {
    loadPatients();
    loadVitals();
  }, []);

  function toList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  }

  async function loadPatients() {
    try {
      const res = await API.get("/patients/");
      setPatients(toList(res.data));
    } catch (_err) {}
  }

  async function loadVitals() {
    try {
      const res = await API.get("/vitals/");
      setVitals(toList(res.data));
    } catch (_err) {
      setStatus("Could not load vitals");
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function clearForm() {
    setEditingId(null);
    setForm({
      patient: "",
      temperature: "",
      heart_rate: "",
      respiration: "",
      weight_lbs: "",
    });
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      patient: String(item.patient?.id ?? item.patient ?? ""),
      temperature: item.temperature ?? "",
      heart_rate: item.heart_rate ?? "",
      respiration: item.respiration ?? "",
      weight_lbs: item.weight_lbs ?? "",
    });
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this vitals record?")) return;
    try {
      await API.delete(`/vitals/${id}/`);
      if (editingId === id) clearForm();
      setStatus("Vitals deleted");
      await loadVitals();
    } catch (_err) {
      setStatus("Failed to delete vitals");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.patient) {
      setStatus("Patient is required");
      return;
    }

    const payload = {
      patient: form.patient,
      temperature: form.temperature || null,
      heart_rate: form.heart_rate || null,
      respiration: form.respiration || null,
      weight_lbs: form.weight_lbs || null,
    };

    try {
      if (editingId) {
        await API.patch(`/vitals/${editingId}/`, payload);
        setStatus("Vitals updated");
      } else {
        await API.post("/vitals/", payload);
        setStatus("Vitals added");
      }
      clearForm();
      await loadVitals();
    } catch (_err) {
      setStatus("Failed to save vitals");
    }
  }

  return (
    <div className="crud-page">
      <div className="crud-shell">
        <aside className="crud-sidebar">
          <h2>Veterinary Management System Doctor Panel</h2>
          <nav className="crud-nav">
            <a href="/doctor-dashboard">Dashboard</a>
            <a className="active" href="/vitals">
              Vitals
            </a>
            <a href="/medications">Medications</a>
            <a href="/treatments">Treatment</a>
            <a href="/documents">Documents</a>
          </nav>
        </aside>
        <main className="crud-main">
          <div className="crud-content">
            <h1>Vitals</h1>
            <p className="page-desc">Capture the basic health readings for each patient.</p>

            <form onSubmit={handleSubmit}>
              <label>Patient</label>
              <select name="patient" value={form.patient} onChange={handleChange} required>
                <option value="">Select patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name || patient.id}
                  </option>
                ))}
              </select>
              <label>Temperature</label>
              <input type="number" step="0.1" name="temperature" value={form.temperature} onChange={handleChange} />
              <label>Heart rate</label>
              <input type="number" name="heart_rate" value={form.heart_rate} onChange={handleChange} />
              <label>Respiration</label>
              <input type="number" name="respiration" value={form.respiration} onChange={handleChange} />
              <label>Weight lbs</label>
              <input type="number" step="0.01" name="weight_lbs" value={form.weight_lbs} onChange={handleChange} />
              <div className="form-actions">
                <button type="submit" className="action-btn">
                  {editingId ? "Update Vitals" : "Add Vitals"}
                </button>
                {editingId ? (
                  <button type="button" className="secondary-btn" onClick={clearForm}>
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>

            <p className="status-msg">{status}</p>

            <div className="record-list">
              {vitals.map((item) => (
                <article key={item.id} className="crud-record-card">
                  <strong>{item.patient_name || item.patient}</strong>
                  <p>Temp: {item.temperature || "-"}</p>
                  <p>Heart rate: {item.heart_rate || "-"}</p>
                  <p>Respiration: {item.respiration || "-"}</p>
                  <div className="form-actions">
                    <button type="button" className="action-btn" onClick={() => startEdit(item)}>
                      Edit
                    </button>
                    <button type="button" className="action-btn" onClick={() => handleDelete(item.id)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
