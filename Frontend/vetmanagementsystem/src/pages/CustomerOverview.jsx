import React, { useEffect, useState } from "react";
import API from "../api";

export default function CustomerOverview() {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [medications, setMedications] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [status, setStatus] = useState("");

  function toList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  }

  useEffect(() => {
    async function load() {
      try {
        const results = await Promise.allSettled([
          API.get("/patients/"),
          API.get("/appointments/"),
          API.get("/vitals/"),
          API.get("/medications/"),
          API.get("/documents/"),
          API.get("/treatments/"),
        ]);

        setPatients(results[0].status === "fulfilled" ? toList(results[0].value.data) : []);
        setAppointments(results[1].status === "fulfilled" ? toList(results[1].value.data) : []);
        setVitals(results[2].status === "fulfilled" ? toList(results[2].value.data) : []);
        setMedications(results[3].status === "fulfilled" ? toList(results[3].value.data) : []);
        setDocuments(results[4].status === "fulfilled" ? toList(results[4].value.data) : []);
        setTreatments(results[5].status === "fulfilled" ? toList(results[5].value.data) : []);
      } catch (_err) {}
    }

    load();
  }, []);

  function itemPatient(item) {
    return item.patient_name || item.patient?.name || item.patient || "-";
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Customer Menu</h2>
        <nav className="nav">
          <a href="/customer-dashboard">Dashboard</a>
          <a className="active" href="/overview">
            Overview
          </a>
          <a href="/patients">Patients</a>
          <a href="/appointments">Appointments</a>
        </nav>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <h1>Customer Overview</h1>
            <p className="page-desc">Check your records in one place.</p>
          </div>
        </div>

        <section className="content">
          {status ? <p className="status-msg">{status}</p> : null}

          <div className="page-grid">
            <article className="page-card">
              <h2>Appointments</h2>
              <p>{appointments.length} records loaded.</p>
            </article>
            <article className="page-card">
              <h2>Vitals</h2>
              <p>{vitals.length} records loaded.</p>
            </article>
            <article className="page-card">
              <h2>Medications</h2>
              <p>{medications.length} records loaded.</p>
            </article>
            <article className="page-card">
              <h2>Documents</h2>
              <p>{documents.length} records loaded.</p>
            </article>
            <article className="page-card">
              <h2>Treatments</h2>
              <p>{treatments.length} records loaded.</p>
            </article>
          </div>

          <div className="record-list">
            {appointments.map((item) => (
              <article key={item.id} className="record-card">
                <strong>{itemPatient(item)}</strong>
                <p>{item.date || "-"}</p>
                <p>Location: {item.location || "-"}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
