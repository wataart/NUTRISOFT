// src/components/InbodyTab.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function InbodyTab({ patientId }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [form, setForm] = useState({
    fecha: '',
    peso_kg: '',
    masa_muscular_kg: '',
    porcentaje_grasa: '',
    masa_grasa_kg: '',
    agua_corporal_l: '',
  });

  useEffect(() => {
    const today = new Date().toISOString().substring(0, 10);
    setForm((f) => ({ ...f, fecha: today }));
  }, []);

  useEffect(() => {
    const fetchInbody = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('inbody_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('fecha', { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setRecords(data || []);
      }
      setLoading(false);
    };

    fetchInbody();
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
      fecha: form.fecha,
      peso_kg: form.peso_kg ? parseFloat(form.peso_kg) : null,
      masa_muscular_kg: form.masa_muscular_kg
        ? parseFloat(form.masa_muscular_kg)
        : null,
      porcentaje_grasa: form.porcentaje_grasa
        ? parseFloat(form.porcentaje_grasa)
        : null,
      masa_grasa_kg: form.masa_grasa_kg
        ? parseFloat(form.masa_grasa_kg)
        : null,
      agua_corporal_l: form.agua_corporal_l
        ? parseFloat(form.agua_corporal_l)
        : null,
    };

    const { data, error } = await supabase
      .from('inbody_records')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error(error);
      setMsg('Error al guardar');
    } else {
      setRecords((prev) => [data, ...prev]);
      setMsg('Registro agregado');
    }
    setSaving(false);
  };

  if (loading) return <div>Cargando registros InBody...</div>;

  return (
    <div className="inbody-tab">
      <form onSubmit={handleSave} className="inbody-form">
        <h3>Nuevo registro InBody</h3>

        <label>
          Fecha:
          <input
            type="date"
            name="fecha"
            value={form.fecha}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Peso (kg):
          <input
            type="number"
            step="0.1"
            name="peso_kg"
            value={form.peso_kg}
            onChange={handleChange}
          />
        </label>

        <label>
          Masa muscular (kg):
          <input
            type="number"
            step="0.1"
            name="masa_muscular_kg"
            value={form.masa_muscular_kg}
            onChange={handleChange}
          />
        </label>

        <label>
          % Grasa:
          <input
            type="number"
            step="0.1"
            name="porcentaje_grasa"
            value={form.porcentaje_grasa}
            onChange={handleChange}
          />
        </label>

        <label>
          Masa grasa (kg):
          <input
            type="number"
            step="0.1"
            name="masa_grasa_kg"
            value={form.masa_grasa_kg}
            onChange={handleChange}
          />
        </label>

        <label>
          Agua corporal (L):
          <input
            type="number"
            step="0.1"
            name="agua_corporal_l"
            value={form.agua_corporal_l}
            onChange={handleChange}
          />
        </label>

        <button type="submit" disabled={saving}>
          {saving ? 'Guardando...' : 'Agregar registro'}
        </button>
        {msg && <p>{msg}</p>}
      </form>

      <h3>Historial InBody</h3>
      {records.length === 0 && <p>Sin registros aún.</p>}

      <table className="inbody-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Peso</th>
            <th>M. muscular</th>
            <th>% Grasa</th>
            <th>M. grasa</th>
            <th>Agua (L)</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id}>
              <td>{r.fecha}</td>
              <td>{r.peso_kg ?? '-'}</td>
              <td>{r.masa_muscular_kg ?? '-'}</td>
              <td>{r.porcentaje_grasa ?? '-'}</td>
              <td>{r.masa_grasa_kg ?? '-'}</td>
              <td>{r.agua_corporal_l ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
