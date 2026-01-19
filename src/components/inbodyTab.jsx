// src/components/InbodyTab.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const EMPTY_FORM = {
  fecha: '',
  sexo: '', // "hombre" | "mujer"
  peso_actual_kg: '',
  estatura_m: '',
  porcentaje_grasa: '',
  porcentaje_grasa_ideal: '',
  masa_muscular_total_kg: '',

  // Grasa segmentada (kg)
  grasa_brazo_izq_kg: '',
  grasa_brazo_der_kg: '',
  grasa_pierna_izq_kg: '',
  grasa_pierna_der_kg: '',
  grasa_torso_kg: '',

  // Masa muscular segmentada (kg)
  mm_brazo_izq_kg: '',
  mm_brazo_der_kg: '',
  mm_pierna_izq_kg: '',
  mm_pierna_der_kg: '',
  mm_torso_kg: '',

  notas: '',
};

export default function InbodyTab({ patientId }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Fecha por defecto al montar
  useEffect(() => {
    const today = new Date().toISOString().substring(0, 10);
    setForm((prev) => ({
      ...prev,
      fecha: prev.fecha || today,
    }));
  }, []);

  // Cargar registro InBody del paciente desde inbody_records
  useEffect(() => {
    const fetchInbody = async () => {
      setLoading(true);
      setMsg('');

      const { data, error } = await supabase
        .from('inbody_records')
        .select('*')
        .eq('patient_id', patientId)
        .single();

      if (error) {
        // PGRST116 = sin filas, normal si no tiene InBody aún
        if (error.code !== 'PGRST116') {
          console.error(error);
        }
        setRecordId(null);
        setForm((prev) => ({
          ...EMPTY_FORM,
          fecha: prev.fecha || new Date().toISOString().substring(0, 10),
        }));
      } else if (data) {
        setRecordId(data.id);

        // Mapear columnas de la BD al formulario (todo a string)
        const next = { ...EMPTY_FORM };
        Object.keys(EMPTY_FORM).forEach((key) => {
          if (data[key] !== undefined && data[key] !== null) {
            next[key] = data[key].toString();
          }
        });

        if (!next.fecha) {
          next.fecha = new Date().toISOString().substring(0, 10);
        }

        setForm(next);
      }

      setLoading(false);
    };

    fetchInbody();
  }, [patientId]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setMsg('');
  };

  // IMC automático: peso (kg) / estatura (m)^2
  const imc = useMemo(() => {
    const peso = parseFloat(form.peso_actual_kg) || 0;
    const estaturaM = parseFloat(form.estatura_m) || 0;
    if (peso <= 0 || estaturaM <= 0) return 0;
    return peso / (estaturaM * estaturaM);
  }, [form.peso_actual_kg, form.estatura_m]);

  // % de grasa ideal según sexo: 25% hombre, 31% mujer
  const grasaIdealPct = useMemo(() => {
    if (form.sexo === 'hombre') return 25;
    if (form.sexo === 'mujer') return 31;
    return 0;
  }, [form.sexo]);

  // Cálculos de grasa corporal, exceso, peso sin exceso
  const derived = useMemo(() => {
    const peso = parseFloat(form.peso_actual_kg) || 0;
    const pctGrasa = parseFloat(form.porcentaje_grasa) || 0;
    const pctIdeal = grasaIdealPct || 0;

    // Grasa corporal total (kg) = peso * %grasa / 100
    const grasaTotalKg =
      peso > 0 && pctGrasa > 0 ? (peso * pctGrasa) / 100 : 0;

    const excesoPct =
      pctGrasa > 0 && pctIdeal > 0 ? pctGrasa - pctIdeal : 0;

    const excesoKg =
      peso > 0 && excesoPct > 0 ? (peso * excesoPct) / 100 : 0;

    const pesoSinExceso =
      peso > 0 && excesoKg > 0 ? peso - excesoKg : 0;

    return {
      grasaTotalKg,
      excesoPct,
      excesoKg,
      pesoSinExceso,
    };
  }, [form.peso_actual_kg, form.porcentaje_grasa, grasaIdealPct]);

  const { grasaTotalKg, excesoPct, excesoKg, pesoSinExceso } = derived;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    const num = (v) =>
      v !== '' && v !== null && v !== undefined ? parseFloat(v) : null;

    const payload = {
      id: recordId || undefined,
      patient_id: patientId,

      fecha: form.fecha || null,
      sexo: form.sexo || null,

      peso_actual_kg: num(form.peso_actual_kg),
      estatura_m: num(form.estatura_m),
      imc: imc || null,

      porcentaje_grasa: num(form.porcentaje_grasa),
      porcentaje_grasa_ideal: grasaIdealPct || null,

      grasa_corporal_total_kg: grasaTotalKg || null,
      exceso_grasa_pct: excesoPct || null,
      exceso_grasa_kg: excesoKg || null,
      peso_sin_exceso_grasa_kg: pesoSinExceso || null,

      masa_muscular_total_kg: num(form.masa_muscular_total_kg),

      // Grasa segmentada
      grasa_brazo_izq_kg: num(form.grasa_brazo_izq_kg),
      grasa_brazo_der_kg: num(form.grasa_brazo_der_kg),
      grasa_pierna_izq_kg: num(form.grasa_pierna_izq_kg),
      grasa_pierna_der_kg: num(form.grasa_pierna_der_kg),
      grasa_torso_kg: num(form.grasa_torso_kg),

      // Masa muscular segmentada
      mm_brazo_izq_kg: num(form.mm_brazo_izq_kg),
      mm_brazo_der_kg: num(form.mm_brazo_der_kg),
      mm_pierna_izq_kg: num(form.mm_pierna_izq_kg),
      mm_pierna_der_kg: num(form.mm_pierna_der_kg),
      mm_torso_kg: num(form.mm_torso_kg),

      notas: form.notas || '',
    };

    const { data, error } = await supabase
      .from('inbody_records')
      .upsert(payload, { onConflict: 'patient_id' })
      .select('id')
      .single();

    if (error) {
      console.error(error);
      setMsg('Error al guardar evaluación InBody');
      setSaving(false);
      return;
    }

    setRecordId(data.id);
    setMsg('Evaluación InBody guardada');
    setSaving(false);
  };

  if (loading) return <div>Cargando evaluación InBody...</div>;

  return (
    <div className="inbody-tab">
      <h3>Evaluación de composición corporal (InBody)</h3>

      <form className="clinical-form" onSubmit={handleSave}>
        {/* DATOS GENERALES */}
        <h4 style={{ gridColumn: '1 / -1' }}>Datos generales</h4>

        <label>
          Fecha de medición
          <input
            type="date"
            value={form.fecha}
            onChange={(e) => handleChange('fecha', e.target.value)}
          />
        </label>

        <label>
          Sexo
          <select
            value={form.sexo}
            onChange={(e) => handleChange('sexo', e.target.value)}
          >
            <option value="">Seleccionar...</option>
            <option value="hombre">Hombre</option>
            <option value="mujer">Mujer</option>
          </select>
        </label>

        <label>
          Peso actual (kg)
          <input
            type="number"
            step="0.1"
            value={form.peso_actual_kg}
            onChange={(e) =>
              handleChange('peso_actual_kg', e.target.value)
            }
          />
        </label>

        <label>
          Estatura (m)
          <input
            type="number"
            step="0.01"
            value={form.estatura_m}
            onChange={(e) =>
              handleChange('estatura_m', e.target.value)
            }
          />
        </label>

        <label>
          IMC (kg/m²)
          <input
            type="number"
            step="0.01"
            value={imc ? imc.toFixed(2) : ''}
            readOnly
          />
        </label>

        {/* GRASA CORPORAL GLOBAL */}
        <h4 style={{ gridColumn: '1 / -1' }}>
          Composición corporal global
        </h4>

        <label>
          % de grasa corporal total
          <input
            type="number"
            step="0.1"
            value={form.porcentaje_grasa}
            onChange={(e) =>
              handleChange('porcentaje_grasa', e.target.value)
            }
          />
        </label>

        <label>
          % de grasa corporal ideal
          <input
            type="number"
            step="0.1"
            value={grasaIdealPct ? grasaIdealPct.toFixed(1) : ''}
            readOnly
          />
          <small
            style={{
              display: 'block',
              fontSize: '0.75rem',
              color: '#9ca3af',
            }}
          >
            Se asigna automáticamente: 25% en hombres, 31% en mujeres.
          </small>
        </label>

        <label>
          Masa muscular total (kg)
          <input
            type="number"
            step="0.1"
            value={form.masa_muscular_total_kg}
            onChange={(e) =>
              handleChange(
                'masa_muscular_total_kg',
                e.target.value
              )
            }
          />
        </label>

        {/* RESUMEN DE CÁLCULOS */}
        <div
          style={{
            gridColumn: '1 / -1',
            marginTop: 8,
            padding: 12,
            borderRadius: 12,
            border: '1px solid #374151',
            background: '#020617',
            fontSize: '0.9rem',
          }}
        >
          <h5 style={{ marginTop: 0 }}>Resumen de grasa corporal</h5>
          <p>
            <strong>Grasa corporal total (kg):</strong>{' '}
            {grasaTotalKg ? grasaTotalKg.toFixed(2) : '—'}
          </p>
          <p>
            <strong>Exceso de grasa (%):</strong>{' '}
            {excesoPct ? excesoPct.toFixed(1) : '—'}
            <br />
            <strong>Exceso de grasa (kg):</strong>{' '}
            {excesoKg ? excesoKg.toFixed(2) : '—'}
          </p>
          <p>
            <strong>Peso sin exceso de grasa (kg):</strong>{' '}
            {pesoSinExceso ? pesoSinExceso.toFixed(2) : '—'}
          </p>
        </div>

        {/* GRASA SEGMENTADA */}
        <h4 style={{ gridColumn: '1 / -1', marginTop: 12 }}>
          Grasa segmentada (kg)
        </h4>

        <div style={{ gridColumn: '1 / -1' }}>
          <table className="menu-items-table">
            <thead>
              <tr>
                <th>Segmento</th>
                <th>Kg de grasa</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Brazo izquierdo</td>
                <td>
                  <input
                    type="number"
                    step="0.1"
                    value={form.grasa_brazo_izq_kg}
                    onChange={(e) =>
                      handleChange(
                        'grasa_brazo_izq_kg',
                        e.target.value
                      )
                    }
                  />
                </td>
              </tr>
              <tr>
                <td>Brazo derecho</td>
                <td>
                  <input
                    type="number"
                    step="0.1"
                    value={form.grasa_brazo_der_kg}
                    onChange={(e) =>
                      handleChange(
                        'grasa_brazo_der_kg',
                        e.target.value
                      )
                    }
                  />
                </td>
              </tr>
              <tr>
                <td>Pierna izquierda</td>
                <td>
                  <input
                    type="number"
                    step="0.1"
                    value={form.grasa_pierna_izq_kg}
                    onChange={(e) =>
                      handleChange(
                        'grasa_pierna_izq_kg',
                        e.target.value
                      )
                    }
                  />
                </td>
              </tr>
              <tr>
                <td>Pierna derecha</td>
                <td>
                  <input
                    type="number"
                    step="0.1"
                    value={form.grasa_pierna_der_kg}
                    onChange={(e) =>
                      handleChange(
                        'grasa_pierna_der_kg',
                        e.target.value
                      )
                    }
                  />
                </td>
              </tr>
              <tr>
                <td>Torso</td>
                <td>
                  <input
                    type="number"
                    step="0.1"
                    value={form.grasa_torso_kg}
                    onChange={(e) =>
                      handleChange('grasa_torso_kg', e.target.value)
                    }
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* MASA MUSCULAR SEGMENTADA */}
        <h4 style={{ gridColumn: '1 / -1', marginTop: 12 }}>
          Masa muscular segmentada (kg)
        </h4>

        <div style={{ gridColumn: '1 / -1' }}>
          <table className="menu-items-table">
            <thead>
              <tr>
                <th>Segmento</th>
                <th>Kg de masa muscular</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Brazo izquierdo</td>
                <td>
                  <input
                    type="number"
                    step="0.1"
                    value={form.mm_brazo_izq_kg}
                    onChange={(e) =>
                      handleChange(
                        'mm_brazo_izq_kg',
                        e.target.value
                      )
                    }
                  />
                </td>
              </tr>
              <tr>
                <td>Brazo derecho</td>
                <td>
                  <input
                    type="number"
                    step="0.1"
                    value={form.mm_brazo_der_kg}
                    onChange={(e) =>
                      handleChange(
                        'mm_brazo_der_kg',
                        e.target.value
                      )
                    }
                  />
                </td>
              </tr>
              <tr>
                <td>Pierna izquierda</td>
                <td>
                  <input
                    type="number"
                    step="0.1"
                    value={form.mm_pierna_izq_kg}
                    onChange={(e) =>
                      handleChange(
                        'mm_pierna_izq_kg',
                        e.target.value
                      )
                    }
                  />
                </td>
              </tr>
              <tr>
                <td>Pierna derecha</td>
                <td>
                  <input
                    type="number"
                    step="0.1"
                    value={form.mm_pierna_der_kg}
                    onChange={(e) =>
                      handleChange(
                        'mm_pierna_der_kg',
                        e.target.value
                      )
                    }
                  />
                </td>
              </tr>
              <tr>
                <td>Torso</td>
                <td>
                  <input
                    type="number"
                    step="0.1"
                    value={form.mm_torso_kg}
                    onChange={(e) =>
                      handleChange('mm_torso_kg', e.target.value)
                    }
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* NOTAS */}
        <label style={{ gridColumn: '1 / -1', marginTop: 12 }}>
          Notas / interpretación de resultados
          <textarea
            rows={3}
            value={form.notas}
            onChange={(e) =>
              handleChange('notas', e.target.value)
            }
          />
        </label>

        <button type="submit" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar evaluación InBody'}
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
