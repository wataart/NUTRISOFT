// src/components/GoalsTab.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const EMPTY_GOALS = {
  fecha: '',
  peso_objetivo_kg: '',
  imc_objetivo: '',
  porcentaje_grasa_objetivo: '',
  masa_muscular_objetivo_kg: '',
  masa_grasa_objetivo_kg: '',      // NUEVO
  agua_corporal_objetivo_l: '',    // NUEVO
  pasos_diarios: '',
  otras_metas: '',
};

export default function GoalsTab({ patientId }) {
  const [form, setForm] = useState(EMPTY_GOALS);
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const today = new Date().toISOString().substring(0, 10);
    setForm((prev) => ({ ...prev, fecha: prev.fecha || today }));
  }, []);

  // Cargar metas desde Supabase
  useEffect(() => {
    const fetchGoals = async () => {
      setLoading(true);
      setMsg('');

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('patient_id', patientId)
        .single();

      if (error) {
        // sin filas todavía es normal
        if (error.code !== 'PGRST116') {
          console.error(error);
        }
        setRecordId(null);
        const today = new Date().toISOString().substring(0, 10);
        setForm((prev) => ({ ...EMPTY_GOALS, fecha: today }));
      } else if (data) {
        setRecordId(data.id);
        const next = { ...EMPTY_GOALS };
        Object.keys(EMPTY_GOALS).forEach((k) => {
          if (data[k] !== undefined && data[k] !== null) {
            next[k] = data[k].toString();
          }
        });
        if (!next.fecha) {
          next.fecha = new Date().toISOString().substring(0, 10);
        }
        setForm(next);
      }

      setLoading(false);
    };

    fetchGoals();
  }, [patientId]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setMsg('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    const num = (v) =>
      v !== '' && v !== null && v !== undefined
        ? parseFloat(v)
        : null;

    const payload = {
      id: recordId || undefined,
      patient_id: patientId,

      fecha: form.fecha || null,
      peso_objetivo_kg: num(form.peso_objetivo_kg),
      imc_objetivo: num(form.imc_objetivo),
      porcentaje_grasa_objetivo: num(form.porcentaje_grasa_objetivo),
      masa_muscular_objetivo_kg: num(form.masa_muscular_objetivo_kg),

      // NUEVOS CAMPOS
      masa_grasa_objetivo_kg: num(form.masa_grasa_objetivo_kg),
      agua_corporal_objetivo_l: num(form.agua_corporal_objetivo_l),

      pasos_diarios: num(form.pasos_diarios),
      otras_metas: form.otras_metas || '',
    };

    const { data, error } = await supabase
      .from('goals')
      .upsert(payload, { onConflict: 'patient_id' })
      .select('id')
      .single();

    if (error) {
      console.error(error);
      setMsg(
        'Error al guardar metas: ' + (error.message || '')
      );
      setSaving(false);
      return;
    }

    setRecordId(data.id);
    setMsg('Metas guardadas');
    setSaving(false);
  };

  if (loading) return <div>Cargando metas...</div>;

  return (
    <div className="goals-tab">
      <h3>Metas del tratamiento</h3>

      <form className="clinical-form" onSubmit={handleSave}>
        <label>
          Fecha de establecimiento de metas
          <input
            type="date"
            value={form.fecha}
            onChange={(e) => handleChange('fecha', e.target.value)}
          />
        </label>

        <h4 style={{ gridColumn: '1 / -1' }}>Metas de composición corporal</h4>

        <label>
          Peso objetivo (kg)
          <input
            type="number"
            step="0.1"
            value={form.peso_objetivo_kg}
            onChange={(e) =>
              handleChange('peso_objetivo_kg', e.target.value)
            }
          />
        </label>

        <label>
          IMC objetivo
          <input
            type="number"
            step="0.1"
            value={form.imc_objetivo}
            onChange={(e) =>
              handleChange('imc_objetivo', e.target.value)
            }
          />
        </label>

        <label>
          % de grasa corporal objetivo
          <input
            type="number"
            step="0.1"
            value={form.porcentaje_grasa_objetivo}
            onChange={(e) =>
              handleChange(
                'porcentaje_grasa_objetivo',
                e.target.value
              )
            }
          />
        </label>

        <label>
          Masa muscular objetivo (kg)
          <input
            type="number"
            step="0.1"
            value={form.masa_muscular_objetivo_kg}
            onChange={(e) =>
              handleChange(
                'masa_muscular_objetivo_kg',
                e.target.value
              )
            }
          />
        </label>

        <label>
          Masa grasa objetivo (kg)
          <input
            type="number"
            step="0.1"
            value={form.masa_grasa_objetivo_kg}
            onChange={(e) =>
              handleChange(
                'masa_grasa_objetivo_kg',
                e.target.value
              )
            }
          />
        </label>

        <label>
          Agua corporal objetivo (L)
          <input
            type="number"
            step="0.1"
            value={form.agua_corporal_objetivo_l}
            onChange={(e) =>
              handleChange(
                'agua_corporal_objetivo_l',
                e.target.value
              )
            }
          />
        </label>

        <h4 style={{ gridColumn: '1 / -1' }}>Hábitos y otros objetivos</h4>

        <label>
          Meta de pasos diarios
          <input
            type="number"
            step="100"
            value={form.pasos_diarios}
            onChange={(e) =>
              handleChange('pasos_diarios', e.target.value)
            }
            placeholder="Ej. 8000"
          />
        </label>

        <label style={{ gridColumn: '1 / -1' }}>
          Otras metas / comentarios
          <textarea
            rows={3}
            value={form.otras_metas}
            onChange={(e) =>
              handleChange('otras_metas', e.target.value)
            }
          />
        </label>

        <button type="submit" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar metas'}
        </button>

        {msg && (
          <p className={msg.startsWith('Error') ? 'error' : 'info'}>
            {msg}
          </p>
        )}
      </form>
    </div>
  );
}
