import React from "react";

export default function DoctorDashboard() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Doctor Menu</h2>
        <nav className="nav">
          <a className="active" href="/doctor-dashboard">
            Dashboard
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
            <h1>Doctor Dashboard</h1>
            <p className="page-desc">Open the areas you use every day.</p>
          </div>
        </div>

        <section className="content">
          <div className="page-grid">
            <article className="page-card">
              <h2>Vitals</h2>
              <p>Record patient readings and health checks.</p>
              <a className="action-link" href="/vitals">
                Open Vitals
              </a>
            </article>
            <article className="page-card">
              <h2>Medications</h2>
              <p>Manage prescriptions and medication notes.</p>
              <a className="action-link" href="/medications">
                Open Medications
              </a>
            </article>
            <article className="page-card">
              <h2>Treatment</h2>
              <p>Keep diagnosis and treatment plans together.</p>
              <a className="action-link" href="/treatments">
                Open Treatment
              </a>
            </article>
            <article className="page-card">
              <h2>Documents</h2>
              <p>Store patient files in one place.</p>
              <a className="action-link" href="/documents">
                Open Documents
              </a>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
