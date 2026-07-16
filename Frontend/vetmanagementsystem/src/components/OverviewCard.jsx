import React from "react";

export default function OverviewCard({ title, value }) {
  return (
    <div className="card stat-card">
      <h4>{title}</h4>
      <p className="stat-value">{value}</p>
    </div>
  );
}
