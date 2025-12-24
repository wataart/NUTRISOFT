// src/pages/PatientsPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import PatientCard from '../components/PatientCard.jsx';

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal edición
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editApellido, setEditApellido] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Modal nuevo paciente
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newApellido, setNewApellido] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTelefono, setNewTelefono] = useState('');
  const [savingNew, setSavingNew] = useState(false);

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

  const openNewModal = () => {
    setNewNombre('');
    setNewApellido('');
    setNewEmail('');
    setNewTelefono('');
    setIsNewOpen(true);
  };

  const closeNewModal = () => {
    setIsNewOpen(false);
    setSavingNew(false);
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    if (!newNombre.trim()) {
      alert('Escribe al menos el nombre del paciente');
      return;
    }

    setSavingNew(true);

    const payload = {
      nombre: newNombre.trim(),
      apellido: newApellido.trim() || null,
      email: newEmail.trim() || null,
      telefono: newTelefono.trim() || null,
    };

    const { data, error } = await supabase
      .from('patients')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error(error);
      alert('Error al crear paciente');
      setSavingNew(false);
      return;
    }

    setPatients((prev) => [...prev, data]);
    closeNewModal();
  };

  // abrir modal de edición
  const openEditModal = (patient) => {
    setSelectedPatient(patient);
    setEditNombre(patient.nombre || '');
    setEditApellido(patient.apellido || '');
    setEditEmail(patient.email || '');
    setEditTelefono(patient.telefono || '');
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setSelectedPatient(null);
    setSavingEdit(false);
  };

  // guardar cambios de edición
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
        apellido: editApellido.trim() || null,
        email: editEmail.trim() || null,
        telefono: editTelefono.trim() || null,
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

    setPatients((prev) =>
      prev.map((p) => (p.id === data.id ? data : p))
    );

    closeEditModal();
  };

  // eliminar paciente
  const handleDeletePatient = async () => {
    if (!selectedPatient) return;

    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar a "${selectedPatient.nombre} ${
        selectedPatient.apellido || ''
      }"? Se eliminarán también sus registros asociados.`
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
        <button onClick={openNewModal}>+ Nuevo paciente</button>
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

      {/* MODAL NUEVO PACIENTE */}
      {isNewOpen && (
        <div
          className="modal-backdrop"
          onClick={closeNewModal}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Nuevo paciente</h3>
            <form
              className="modal-form"
              onSubmit={handleCreatePatient}
            >
              <label>
                Nombre
                <input
                  type="text"
                  value={newNombre}
                  onChange={(e) =>
                    setNewNombre(e.target.value)
                  }
                  required
                />
              </label>

              <label>
                Apellidos
                <input
                  type="text"
                  value={newApellido}
                  onChange={(e) =>
                    setNewApellido(e.target.value)
                  }
                />
              </label>

              <label>
                Teléfono
                <input
                  type="text"
                  value={newTelefono}
                  onChange={(e) =>
                    setNewTelefono(e.target.value)
                  }
                />
              </label>

              <label>
                Correo electrónico
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) =>
                    setNewEmail(e.target.value)
                  }
                />
              </label>

              <div className="modal-actions">
                <button
                  type="submit"
                  disabled={savingNew}
                >
                  {savingNew
                    ? 'Guardando...'
                    : 'Crear paciente'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeNewModal}
                  disabled={savingNew}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR / ELIMINAR PACIENTE */}
      {isEditOpen && selectedPatient && (
        <div
          className="modal-backdrop"
          onClick={closeEditModal}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Editar paciente</h3>
            <form
              className="modal-form"
              onSubmit={handleSaveEdit}
            >
              <label>
                Nombre
                <input
                  type="text"
                  value={editNombre}
                  onChange={(e) =>
                    setEditNombre(e.target.value)
                  }
                  required
                />
              </label>

              <label>
                Apellidos
                <input
                  type="text"
                  value={editApellido}
                  onChange={(e) =>
                    setEditApellido(e.target.value)
                  }
                />
              </label>

              <label>
                Teléfono
                <input
                  type="text"
                  value={editTelefono}
                  onChange={(e) =>
                    setEditTelefono(e.target.value)
                  }
                />
              </label>

              <label>
                Correo electrónico
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) =>
                    setEditEmail(e.target.value)
                  }
                />
              </label>

              <div className="modal-actions">
                <button
                  type="submit"
                  disabled={savingEdit}
                >
                  {savingEdit
                    ? 'Guardando...'
                    : 'Guardar cambios'}
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={handleDeletePatient}
                  disabled={savingEdit}
                >
                  {savingEdit
                    ? 'Eliminando...'
                    : 'Eliminar paciente'}
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
