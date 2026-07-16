import React, { useEffect, useState } from "react";
import API from "../api";

export default function DoctorOverview() {
  const [appointments, setAppointments] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [patients, setPatients] = useState([]);
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
          API.get("/treatments/"),
        ]);

        setPatients(results[0].status === "fulfilled" ? toList(results[0].value.data) : []);
        setAppointments(results[1].status === "fulfilled" ? toList(results[1].value.data) : []);
        setTreatments(results[2].status === "fulfilled" ? toList(results[2].value.data) : []);
      } catch (_err) {
        setStatus("Failed to load overview data");
      }
    }

    load();
  }, []);

  function patientName(item) {
    return item.patient_name || item.patient?.name || item.patient || "-";
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Doctor Menu</h2>
        <nav className="nav">
          <a href="/doctor-dashboard">Dashboard</a>
          <a className="active" href="/overview">
            Overview
          </a>
          <a href="/vitals">Vitals</a>
          <a href="/medications">Medications</a>
          <a href="/treatments">Treatment</a>
          <a href="/documents">Documents</a>
        </nav>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <h1>Doctor Overview</h1>
            <p className="page-desc">A clear view of appointments and treatments.</p>
          </div>
        </div>

        <section className="content">
          {status ? <p className="status-msg">{status}</p> : null}

          <div className="page-grid">
            <article className="page-card">
              <h2>Patients</h2>
              <p>{patients.length} records loaded.</p>
            </article>
            <article className="page-card">
              <h2>Appointments</h2>
              <p>{appointments.length} records loaded.</p>
            </article>
            <article className="page-card">
              <h2>Treatments</h2>
              <p>{treatments.length} records loaded.</p>
            </article>
          </div>

          <div className="record-list">
            {appointments.map((item) => (
              <article key={item.id} className="record-card">
                <strong>{patientName(item)}</strong>
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
