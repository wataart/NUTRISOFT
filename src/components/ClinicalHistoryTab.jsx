import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ClinicalHistoryTab({ patientId }) {
  const [form, setForm] = useState({
    datos_personales: '',
    habitos_alimenticios: '',
    toxicomanias: '',
    actividad_sueno: '',
    antecedentes_personales: '',
    antecedentes_familiares: '',
    tratamientos: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('clinical_history')
        .select('*')
        .eq('patient_id', patientId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error(error);
      } else if (data) {
        setForm({
          datos_personales: data.datos_personales || '',
          habitos_alimenticios: data.habitos_alimenticios || '',
          toxicomanias: data.toxicomanias || '',
          actividad_sueno: data.actividad_sueno || '',
          antecedentes_personales: data.antecedentes_personales || '',
          antecedentes_familiares: data.antecedentes_familiares || '',
          tratamientos: data.tratamientos || '',
        });
      }
      setLoading(false);
    };

    fetchHistory();
  }, [patientId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    // upsert: si existe lo actualiza, si no lo crea
    const { error } = await supabase.from('clinical_history').upsert({
      patient_id: patientId,
      ...form,
    });

    if (error) {
      console.error(error);
      setMsg('Error al guardar');
    } else {
      setMsg('Historia clínica guardada');
    }
    setSaving(false);
  };

  if (loading) return <div>Cargando historia clínica...</div>;

  return (
    <form className="clinical-form" onSubmit={handleSave}>
      <label>
        Datos personales (dirección, ocupación, etc.):
        <textarea
          name="datos_personales"
          value={form.datos_personales}
          onChange={handleChange}
          rows={3}
        />
      </label>

      <label>
        Hábitos alimenticios:
        <textarea
          name="habitos_alimenticios"
          value={form.habitos_alimenticios}
          onChange={handleChange}
          rows={3}
        />
      </label>

      <label>
        Toxicomanías:
        <textarea
          name="toxicomanias"
          value={form.toxicomanias}
          onChange={handleChange}
          rows={3}
        />
      </label>

      <label>
        Actividad física y sueño:
        <textarea
          name="actividad_sueno"
          value={form.actividad_sueno}
          onChange={handleChange}
          rows={3}
        />
      </label>

      <label>
        Antecedentes personales:
        <textarea
          name="antecedentes_personales"
          value={form.antecedentes_personales}
          onChange={handleChange}
          rows={3}
        />
      </label>

      <label>
        Antecedentes familiares:
        <textarea
          name="antecedentes_familiares"
          value={form.antecedentes_familiares}
          onChange={handleChange}
          rows={3}
        />
      </label>

      <label>
        Tratamientos y medicamentos:
        <textarea
          name="tratamientos"
          value={form.tratamientos}
          onChange={handleChange}
          rows={3}
        />
      </label>

      <button type="submit" disabled={saving}>
        {saving ? 'Guardando...' : 'Guardar'}
      </button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
