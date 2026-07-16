import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="home-page">
      <main className="home-wrap">
        <section className="home-hero hero-large">
          <h1>Veterinary Management System</h1>
          <p>
            Keep patient records, appointments, treatments, and files in one
            simple place for doctors and customers.
          </p>

          <div className="button-row">
            <Link className="button-link" to="/login">
              Customer Login
            </Link>
            <Link className="button-link" to="/doctor/login">
              Doctor Login
            </Link>
          </div>
          <div className="page-grid">
            <div className="page-card">
              <h2>Patients</h2>
              <p className="page-desc">Store patient details in a clean and simple layout.</p>
            </div>
            <div className="page-card">
              <h2>Appointments</h2>
              <p className="page-desc">Track visits with easy-to-read booking fields.</p>
            </div>
            <div className="page-card">
              <h2>Treatments</h2>
              <p className="page-desc">Keep care notes and follow-up information together.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
