// src/components/Recall24hTab.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Recall24hTab({ patientId }) {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({
    fecha: '',
    descripcion_alimentos: '',
    calorias: '',
    proteinas_g: '',
    grasas_g: '',
    carbohidratos_g: '',
    notas: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const today = new Date().toISOString().substring(0, 10);
    setForm((f) => ({ ...f, fecha: today }));
  }, []);

  useEffect(() => {
    const fetchRecalls = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('recall_24h')
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

    fetchRecalls();
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
      descripcion_alimentos: form.descripcion_alimentos,
      calorias: form.calorias ? parseFloat(form.calorias) : null,
      proteinas_g: form.proteinas_g ? parseFloat(form.proteinas_g) : null,
      grasas_g: form.grasas_g ? parseFloat(form.grasas_g) : null,
      carbohidratos_g: form.carbohidratos_g
        ? parseFloat(form.carbohidratos_g)
        : null,
      notas: form.notas,
    };

    const { data, error } = await supabase
      .from('recall_24h')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error(error);
      setMsg('Error al guardar recuento');
    } else {
      setRecords((prev) => [data, ...prev]);
      setMsg('Recuento agregado');
    }
    setSaving(false);
  };

  if (loading) return <div>Cargando recuentos...</div>;

  return (
    <div className="recall-tab">
      <form className="recall-form" onSubmit={handleSave}>
        <h3>Nuevo recuento 24 h</h3>

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
          Descripción de alimentos (con tiempos, porciones, etc.):
          <textarea
            name="descripcion_alimentos"
            value={form.descripcion_alimentos}
            onChange={handleChange}
            rows={4}
          />
        </label>

        <label>
          Calorías totales:
          <input
            type="number"
            step="1"
            name="calorias"
            value={form.calorias}
            onChange={handleChange}
          />
        </label>

        <label>
          Proteínas (g):
          <input
            type="number"
            step="0.1"
            name="proteinas_g"
            value={form.proteinas_g}
            onChange={handleChange}
          />
        </label>

        <label>
          Grasas (g):
          <input
            type="number"
            step="0.1"
            name="grasas_g"
            value={form.grasas_g}
            onChange={handleChange}
          />
        </label>

        <label>
          Carbohidratos (g):
          <input
            type="number"
            step="0.1"
            name="carbohidratos_g"
            value={form.carbohidratos_g}
            onChange={handleChange}
          />
        </label>

        <label>
          Notas:
          <textarea
            name="notas"
            value={form.notas}
            onChange={handleChange}
            rows={2}
          />
        </label>

        <button type="submit" disabled={saving}>
          {saving ? 'Guardando...' : 'Agregar recuento'}
        </button>
        {msg && <p>{msg}</p>}
      </form>

      <h3>Historial de recuentos</h3>
      {records.length === 0 && <p>Sin recuentos aún.</p>}

      <ul className="recall-list">
        {records.map((r) => (
          <li key={r.id} className="recall-item">
            <strong>{r.fecha}</strong> – {r.calorias ?? '-'} kcal
            <br />
            <small>{r.descripcion_alimentos?.slice(0, 100)}...</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
