import React, { useEffect, useRef, useState } from "react";
import API from "../api";

export default function Documents() {
  const fileRef = useRef(null);
  const [patients, setPatients] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    patient: "",
    file: null,
  });

  useEffect(() => {
    loadPatients();
    loadDocuments();
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

  async function loadDocuments() {
    try {
      const res = await API.get("/documents/");
      setDocuments(toList(res.data));
    } catch (_err) {
      setStatus("Could not load documents");
    }
  }

  function handleChange(event) {
    const { name, value, files } = event.target;
    if (name === "file") {
      setForm((current) => ({ ...current, file: files?.[0] || null }));
      return;
    }
    setForm((current) => ({ ...current, [name]: value }));
  }

  function clearForm() {
    setEditingId(null);
    setForm({ patient: "", file: null });
    if (fileRef.current) fileRef.current.value = "";
  }

  function startEdit(document) {
    setEditingId(document.id);
    setForm({
      patient: String(document.patient?.id ?? document.patient ?? ""),
      file: null,
    });
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this document?")) return;
    try {
      await API.delete(`/documents/${id}/`);
      if (editingId === id) clearForm();
      setStatus("Document deleted");
      await loadDocuments();
    } catch (_err) {
      setStatus("Failed to delete document");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.patient) {
      setStatus("Patient is required");
      return;
    }

    const payload = new FormData();
    payload.append("patient", form.patient);
    if (form.file) payload.append("file", form.file);

    try {
      if (editingId) {
        await API.patch(`/documents/${editingId}/`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setStatus("Document updated");
      } else {
        if (!form.file) {
          setStatus("File is required for new document");
          return;
        }
        await API.post("/documents/", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setStatus("Document added");
      }
      clearForm();
      await loadDocuments();
    } catch (_err) {
      setStatus("Failed to save document");
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
            <a href="/treatments">Treatment</a>
            <a className="active" href="/documents">
              Documents
            </a>
          </nav>
        </aside>
        <main className="crud-main">
          <div className="crud-content">
            <h1>Documents</h1>
            <p className="page-desc">Store patient files in one place.</p>

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
              <label>Document File</label>
              <input ref={fileRef} type="file" name="file" onChange={handleChange} />
              <div className="form-actions">
                <button type="submit" className="action-btn">
                  {editingId ? "Update Document" : "Add Document"}
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
              {documents.map((document) => (
                <article key={document.id} className="crud-record-card">
                  <strong>{document.title || "Document"}</strong>
                  <p>{document.patient_name || document.patient}</p>
                  <p>{document.issued_date || ""}</p>
                  <div className="form-actions">
                    <button type="button" className="action-btn" onClick={() => startEdit(document)}>
                      Edit
                    </button>
                    <button type="button" className="action-btn" onClick={() => handleDelete(document.id)}>
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
