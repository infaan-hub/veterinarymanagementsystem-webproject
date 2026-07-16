import React, { useEffect, useState } from "react";
import API from "../api";

export default function Treatments() {
  const [patients, setPatients] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    patient: "",
    diagnosis: "",
    treatment_description: "",
    follow_up_date: "",
  });

  useEffect(() => {
    loadPatients();
    loadTreatments();
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

  async function loadTreatments() {
    try {
      const res = await API.get("/treatments/");
      setTreatments(toList(res.data));
    } catch (_err) {
      setStatus("Could not load treatments");
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function clearForm() {
    setEditingId(null);
    setForm({ patient: "", diagnosis: "", treatment_description: "", follow_up_date: "" });
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      patient: String(item.patient?.id ?? item.patient ?? ""),
      diagnosis: item.diagnosis || item.name || "",
      treatment_description: item.treatment_description || item.description || "",
      follow_up_date: item.follow_up_date || item.date || "",
    });
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this treatment?")) return;
    try {
      await API.delete(`/treatments/${id}/`);
      if (editingId === id) clearForm();
      setStatus("Treatment deleted");
      await loadTreatments();
    } catch (_err) {
      setStatus("Failed to delete treatment");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.patient || !form.diagnosis.trim()) {
      setStatus("Patient and diagnosis are required");
      return;
    }

    const payload = {
      patient: form.patient,
      diagnosis: form.diagnosis,
      treatment_description: form.treatment_description,
      follow_up_date: form.follow_up_date || null,
    };

    try {
      if (editingId) {
        await API.patch(`/treatments/${editingId}/`, payload);
        setStatus("Treatment updated");
      } else {
        await API.post("/treatments/", payload);
        setStatus("Treatment added");
      }
      clearForm();
      await loadTreatments();
    } catch (_err) {
      setStatus("Failed to save treatment");
    }
  }

  return (
    <div className="crud-page">
      <div className="crud-shell">
        <aside className="crud-sidebar">
          <h2>Veterinary Management System Doctor Panel</h2>
          <nav className="crud-nav">
            <a href="/doctor-dashboard">Dashboard</a>
            <a href="/vitals">Vitals</a>
            <a href="/medications">Medications</a>
            <a href="/documents">Documents</a>
            <a className="active" href="/treatments">
              Treatment
            </a>
          </nav>
        </aside>
        <main className="crud-main">
          <div className="crud-content">
            <h1>Treatments</h1>
            <p className="page-desc">Add the diagnosis and follow-up in one place.</p>

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
              <label>Diagnosis</label>
              <input name="diagnosis" value={form.diagnosis} onChange={handleChange} required />
              <label>Description</label>
              <textarea name="treatment_description" value={form.treatment_description} onChange={handleChange} />
              <label>Follow-up date</label>
              <input type="date" name="follow_up_date" value={form.follow_up_date} onChange={handleChange} />
              <div className="form-actions">
                <button type="submit" className="action-btn">
                  {editingId ? "Update Treatment" : "Add Treatment"}
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
              {treatments.map((item) => (
                <article key={item.id} className="crud-record-card">
                  <strong>{item.diagnosis || item.name}</strong>
                  <p>{item.patient_name || item.patient}</p>
                  <p>{item.treatment_description || item.description || ""}</p>
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
