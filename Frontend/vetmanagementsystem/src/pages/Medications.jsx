import React, { useEffect, useState } from "react";
import API from "../api";

export default function Medications() {
  const [patients, setPatients] = useState([]);
  const [medications, setMedications] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    patient: "",
    name: "",
    dosage: "",
    frequency: "",
    duration: "",
    notes: "",
  });

  useEffect(() => {
    loadPatients();
    loadMedications();
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

  async function loadMedications() {
    try {
      const res = await API.get("/medications/");
      setMedications(toList(res.data));
    } catch (_err) {
      setStatus("Could not load medications");
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function clearForm() {
    setEditingId(null);
    setForm({ patient: "", name: "", dosage: "", frequency: "", duration: "", notes: "" });
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      patient: String(item.patient?.id ?? item.patient ?? ""),
      name: item.name || "",
      dosage: item.dosage || "",
      frequency: item.frequency || "",
      duration: item.duration || "",
      notes: item.notes || "",
    });
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this medication?")) return;
    try {
      await API.delete(`/medications/${id}/`);
      if (editingId === id) clearForm();
      setStatus("Medication deleted");
      await loadMedications();
    } catch (_err) {
      setStatus("Failed to delete medication");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.patient || !form.name.trim()) {
      setStatus("Patient and medication name are required");
      return;
    }

    const payload = {
      patient: form.patient,
      name: form.name,
      dosage: form.dosage,
      frequency: form.frequency,
      duration: form.duration,
      notes: form.notes,
    };

    try {
      if (editingId) {
        await API.patch(`/medications/${editingId}/`, payload);
        setStatus("Medication updated");
      } else {
        await API.post("/medications/", payload);
        setStatus("Medication added");
      }
      clearForm();
      await loadMedications();
    } catch (_err) {
      setStatus("Failed to save medication");
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
            <a className="active" href="/medications">
              Medications
            </a>
            <a href="/treatments">Treatment</a>
            <a href="/documents">Documents</a>
          </nav>
        </aside>
        <main className="crud-main">
          <div className="crud-content">
            <h1>Medications</h1>
            <p className="page-desc">Keep prescriptions clear and easy to follow.</p>

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
              <label>Medication Name</label>
              <input name="name" value={form.name} onChange={handleChange} required />
              <label>Dosage</label>
              <input name="dosage" value={form.dosage} onChange={handleChange} />
              <label>Frequency</label>
              <input name="frequency" value={form.frequency} onChange={handleChange} />
              <label>Duration</label>
              <input name="duration" value={form.duration} onChange={handleChange} />
              <label>Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} />
              <div className="form-actions">
                <button type="submit" className="action-btn">
                  {editingId ? "Update Medication" : "Add Medication"}
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
              {medications.map((item) => (
                <article key={item.id} className="crud-record-card">
                  <strong>{item.name}</strong>
                  <p>{item.patient_name || item.patient}</p>
                  <p>{item.dosage || ""}</p>
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
