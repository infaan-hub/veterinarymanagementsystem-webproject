import React from "react";

export default function PatientCard({ patient }) {
  return (
    <div className="card">
      <h3>{patient.name}</h3>
      <p>Species: {patient.species}</p>
      <p>Breed: {patient.breed || "N/A"}</p>
      <p>Gender: {patient.gender || "N/A"}</p>
    </div>
  );
}
