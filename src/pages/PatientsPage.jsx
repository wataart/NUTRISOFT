// src/pages/PatientsPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import PatientCard from '../components/PatientCard.jsx';

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // estado para el modal de edición
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editApellido, setEditApellido] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const navigate = useNavigate();

  // cargar pacientes
  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      setErrorMsg('');

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setPatients(data || []);
      }
      setLoading(false);
    };

    fetchPatients();
  }, []);

  // crear nuevo paciente
  const handleNewPatient = async () => {
    const nombre = window.prompt('Nombre del paciente:');
    if (!nombre) return;

    const apellido = window.prompt('Apellidos (opcional):') || '';

    const { data, error } = await supabase
      .from('patients')
      .insert({ nombre, apellido })
      .select()
      .single();

    if (error) {
      alert(error.message);
    } else {
      setPatients((prev) => [...prev, data]);
    }
  };

  // abrir modal de edición
  const openEditModal = (patient) => {
    setSelectedPatient(patient);
    setEditNombre(patient.nombre || '');
    setEditApellido(patient.apellido || '');
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setSelectedPatient(null);
    setEditNombre('');
    setEditApellido('');
    setSavingEdit(false);
  };

  // guardar cambios
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    if (!editNombre.trim()) {
      alert('El nombre no puede estar vacío');
      return;
    }

    setSavingEdit(true);

    const { data, error } = await supabase
      .from('patients')
      .update({
        nombre: editNombre.trim(),
        apellido: editApellido.trim(),
      })
      .eq('id', selectedPatient.id)
      .select()
      .single();

    if (error) {
      console.error(error);
      alert('Error al actualizar el paciente');
      setSavingEdit(false);
      return;
    }

    // actualizar lista en memoria
    setPatients((prev) =>
      prev.map((p) => (p.id === data.id ? data : p))
    );

    closeEditModal();
  };

  // eliminar paciente
  const handleDeletePatient = async () => {
    if (!selectedPatient) return;

    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar a "${selectedPatient.nombre} ${selectedPatient.apellido || ''}"? Se eliminarán también sus registros asociados.`
    );
    if (!confirmar) return;

    setSavingEdit(true);

    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', selectedPatient.id);

    if (error) {
      console.error(error);
      alert('Error al eliminar el paciente');
      setSavingEdit(false);
      return;
    }

    // quitarlo de la lista
    setPatients((prev) =>
      prev.filter((p) => p.id !== selectedPatient.id)
    );

    closeEditModal();
  };

  if (loading) return <div>Cargando pacientes...</div>;

  return (
    <div className="patients-page">
      <header className="patients-header">
        <h2>Pacientes</h2>
        <button onClick={handleNewPatient}>+ Nuevo paciente</button>
      </header>

      {errorMsg && <p className="error">{errorMsg}</p>}

      <div className="patients-grid">
        {patients.map((p) => (
          <PatientCard
            key={p.id}
            patient={p}
            onClick={() => navigate(`/patients/${p.id}`)}
            onEdit={() => openEditModal(p)}
          />
        ))}
      </div>

      {/* Modal para editar / eliminar paciente */}
      {isEditOpen && selectedPatient && (
        <div className="modal-backdrop" onClick={closeEditModal}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()} // para que no cierre al hacer click dentro
          >
            <h3>Editar paciente</h3>
            <form onSubmit={handleSaveEdit} className="modal-form">
              <label>
                Nombre:
                <input
                  type="text"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  required
                />
              </label>

              <label>
                Apellidos:
                <input
                  type="text"
                  value={editApellido}
                  onChange={(e) => setEditApellido(e.target.value)}
                />
              </label>

              <div className="modal-actions">
                <button type="submit" disabled={savingEdit}>
                  {savingEdit ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={handleDeletePatient}
                  disabled={savingEdit}
                >
                  {savingEdit ? 'Eliminando...' : 'Eliminar paciente'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeEditModal}
                  disabled={savingEdit}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
