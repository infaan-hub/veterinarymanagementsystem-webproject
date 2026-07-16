import React from "react";

export default function VisitCard({ visit }) {
  return (
    <div className="card">
      <h3>{visit.patient_name || "Appointment"}</h3>
      <p>Date: {visit.visit_date ? new Date(visit.visit_date).toLocaleDateString() : "-"}</p>
      <p>Status: {visit.visit_status || "Scheduled"}</p>
      <p>Notes: {visit.notes || "-"}</p>
    </div>
  );
}
