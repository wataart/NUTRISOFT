// src/components/NutritionCalcTab.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function NutritionCalcTab({ patientId }) {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({
    fecha: '',
    formula: '',
    geb: '',
    get: '',
    actividad_factor: '',
    cuadro_dietosintetico: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const today = new Date().toISOString().substring(0, 10);
    setForm((f) => ({ ...f, fecha: today }));
  }, []);

  useEffect(() => {
    const fetchCalcs = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('nutrition_calculations')
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

    fetchCalcs();
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
      formula: form.formula,
      geb: form.geb ? parseFloat(form.geb) : null,
      get: form.get ? parseFloat(form.get) : null,
      actividad_factor: form.actividad_factor
        ? parseFloat(form.actividad_factor)
        : null,
      // si en la BD lo defines como TEXT, se guarda como string
      cuadro_dietosintetico: form.cuadro_dietosintetico,
    };

    const { data, error } = await supabase
      .from('nutrition_calculations')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error(error);
      setMsg('Error al guardar cálculo');
    } else {
      setRecords((prev) => [data, ...prev]);
      setMsg('Cálculo agregado');
    }
    setSaving(false);
  };

  if (loading) return <div>Cargando cálculos...</div>;

  return (
    <div className="nutrition-tab">
      <form className="nutrition-form" onSubmit={handleSave}>
        <h3>Nuevo cálculo nutricional</h3>

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
          Fórmula utilizada (Mifflin, Schofield, etc.):
          <input
            type="text"
            name="formula"
            value={form.formula}
            onChange={handleChange}
          />
        </label>

        <label>
          GEB (kcal):
          <input
            type="number"
            step="1"
            name="geb"
            value={form.geb}
            onChange={handleChange}
          />
        </label>

        <label>
          GET (kcal):
          <input
            type="number"
            step="1"
            name="get"
            value={form.get}
            onChange={handleChange}
          />
        </label>

        <label>
          Factor de actividad:
          <input
            type="number"
            step="0.01"
            name="actividad_factor"
            value={form.actividad_factor}
            onChange={handleChange}
          />
        </label>

        <label>
          Cuadro dietosintético (equivalentes por grupo):
          <textarea
            name="cuadro_dietosintetico"
            value={form.cuadro_dietosintetico}
            onChange={handleChange}
            rows={4}
          />
        </label>

        <button type="submit" disabled={saving}>
          {saving ? 'Guardando...' : 'Agregar cálculo'}
        </button>
        {msg && <p>{msg}</p>}
      </form>

      <h3>Historial de cálculos</h3>
      {records.length === 0 && <p>Sin cálculos aún.</p>}

      <table className="nutrition-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Fórmula</th>
            <th>GEB</th>
            <th>GET</th>
            <th>Factor actividad</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id}>
              <td>{r.fecha}</td>
              <td>{r.formula}</td>
              <td>{r.geb ?? '-'}</td>
              <td>{r.get ?? '-'}</td>
              <td>{r.actividad_factor ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
