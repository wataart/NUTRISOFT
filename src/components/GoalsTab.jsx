// src/components/GoalsTab.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function GoalsTab({ patientId }) {
  const [form, setForm] = useState({
    peso_objetivo_kg: '',
    masa_muscular_objetivo_kg: '',
    porcentaje_grasa_objetivo: '',
    notas: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const fetchGoals = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('patient_id', patientId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error(error);
      } else if (data) {
        setForm({
          peso_objetivo_kg: data.peso_objetivo_kg ?? '',
          masa_muscular_objetivo_kg: data.masa_muscular_objetivo_kg ?? '',
          porcentaje_grasa_objetivo: data.porcentaje_grasa_objetivo ?? '',
          notas: data.notas ?? '',
        });
      }
      setLoading(false);
    };

    fetchGoals();
  }, [patientId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    const payload = {
      patient_id: patientId,
      peso_objetivo_kg: form.peso_objetivo_kg
        ? parseFloat(form.peso_objetivo_kg)
        : null,
      masa_muscular_objetivo_kg: form.masa_muscular_objetivo_kg
        ? parseFloat(form.masa_muscular_objetivo_kg)
        : null,
      porcentaje_grasa_objetivo: form.porcentaje_grasa_objetivo
        ? parseFloat(form.porcentaje_grasa_objetivo)
        : null,
      notas: form.notas,
    };

    const { error } = await supabase.from('goals').upsert(payload);

    if (error) {
      console.error(error);
      setMsg('Error al guardar metas');
    } else {
      setMsg('Metas guardadas');
    }
    setSaving(false);
  };

  if (loading) return <div>Cargando metas...</div>;

  return (
    <form className="goals-form" onSubmit={handleSave}>
      <label>
        Peso objetivo (kg):
        <input
          type="number"
          step="0.1"
          name="peso_objetivo_kg"
          value={form.peso_objetivo_kg}
          onChange={handleChange}
        />
      </label>

      <label>
        Masa muscular objetivo (kg):
        <input
          type="number"
          step="0.1"
          name="masa_muscular_objetivo_kg"
          value={form.masa_muscular_objetivo_kg}
          onChange={handleChange}
        />
      </label>

      <label>
        % Grasa objetivo:
        <input
          type="number"
          step="0.1"
          name="porcentaje_grasa_objetivo"
          value={form.porcentaje_grasa_objetivo}
          onChange={handleChange}
        />
      </label>

      <label>
        Notas:
        <textarea
          name="notas"
          value={form.notas}
          onChange={handleChange}
          rows={3}
        />
      </label>

      <button type="submit" disabled={saving}>
        {saving ? 'Guardando...' : 'Guardar metas'}
      </button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
