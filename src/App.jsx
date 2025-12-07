import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PatientsPage from './pages/PatientsPage.jsx';
import PatientDetailPage from './pages/PatientDetailPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PatientsPage />} />
      <Route path="/patients/:id" element={<PatientDetailPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
