// src/components/PatientCard.jsx
import React from 'react';

export default function PatientCard({ patient, onClick, onEdit }) {
  const fullName = `${patient.nombre || ''} ${
    patient.apellido || ''
  }`.trim();

  return (
    <div className="patient-card" onClick={onClick}>
      <div className="patient-card-inner">
        <div className="patient-avatar">
          <div className="avatar-circle" />
        </div>

        <div className="patient-name-bar">{fullName}</div>

        {(patient.telefono || patient.email) && (
          <div className="patient-contact">
            {patient.telefono && (
              <div className="patient-contact-line">
                📞 {patient.telefono}
              </div>
            )}
            {patient.email && (
              <div className="patient-contact-line">
                ✉️ {patient.email}
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          className="patient-edit-btn"
          onClick={(e) => {
            e.stopPropagation();
            onEdit && onEdit();
          }}
        >
          Editar
        </button>
      </div>
    </div>
  );
}
