import React from "react";

export default function CustomerDashboard() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Customer Menu</h2>
        <nav className="nav">
          <a className="active" href="/customer-dashboard">
            Dashboard
          </a>
          <a href="/patients">Patients</a>
          <a href="/appointments">Appointments</a>
          <a href="/overview">Overview</a>
        </nav>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <h1>Customer Dashboard</h1>
            <p className="page-desc">A simple summary of your account and records.</p>
          </div>
        </div>

        <section className="content">
          <div className="page-grid">
            <article className="page-card">
              <h2>Patients</h2>
              <p>See your pet records and profile details.</p>
              <a className="action-link" href="/patients">
                Open Patients
              </a>
            </article>
            <article className="page-card">
              <h2>Appointments</h2>
              <p>View appointment history and upcoming visits.</p>
              <a className="action-link" href="/appointments">
                Open Appointments
              </a>
            </article>
            <article className="page-card">
              <h2>Overview</h2>
              <p>Check vitals, medications, documents, and treatments.</p>
              <a className="action-link" href="/overview">
                Open Overview
              </a>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
