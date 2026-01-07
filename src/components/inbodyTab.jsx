// src/components/InbodyTab.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function InbodyTab({ patientId }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [goals, setGoals] = useState(null);

  const [patientSex, setPatientSex] = useState(null);

  const [form, setForm] = useState({
    fecha: '',
    peso_kg: '',
    peso_ideal_kg: '',
    imc: '',
    grasa_visceral_puntos: '',
    agua_corporal_l: '',
    agua_ideal_min_l: '',
    agua_ideal_max_l: '',
    masa_grasa_kg: '',
    porcentaje_grasa: '',
    masa_muscular_kg: '',
    porcentaje_grasa_ideal: '',
    // NUEVO: grasa segmentada
    grasa_brazo_izq_kg: '',
    grasa_brazo_der_kg: '',
    grasa_pierna_izq_kg: '',
    grasa_pierna_der_kg: '',
    grasa_tronco_kg: '',
    // NUEVO: masa muscular segmentada
    masa_brazo_izq_kg: '',
    masa_brazo_der_kg: '',
    masa_pierna_izq_kg: '',
    masa_pierna_der_kg: '',
    masa_tronco_kg: '',
  });

  // Fecha por defecto
  useEffect(() => {
    const today = new Date().toISOString().substring(0, 10);
    setForm((f) => ({ ...f, fecha: today }));
  }, []);

  // Cargar registros InBody
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

  // Cargar metas
  useEffect(() => {
    const fetchGoals = async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('patient_id', patientId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error(error);
      } else if (data) {
        setGoals(data);
      }
    };

    fetchGoals();
  }, [patientId]);

  // Cargar sexo del paciente
  useEffect(() => {
    const fetchPatientSex = async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) {
        console.error('Error al obtener paciente:', error);
        return;
      }

      const sex =
        data.sexo ??
        data.sex ??
        data.genero ??
        data.gender ??
        null;

      setPatientSex(sex);
    };

    fetchPatientSex();
  }, [patientId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setMsg('');
  };

 // Cálculos de grasa corporal, exceso, etc.
const derived = useMemo(() => {
  const peso = parseFloat(form.peso_actual_kg) || 0;
  const estaturaM = parseFloat(form.estatura_m) || 0;
  const pctGrasa = parseFloat(form.porcentaje_grasa) || 0;
  const pctIdeal = form.porcentaje_grasa_ideal
    ? parseFloat(form.porcentaje_grasa_ideal)
    : 0;

  const grasaTotalKg =
    peso > 0 && estaturaM > 0 ? peso / (estaturaM * estaturaM) : 0;

  const excesoPct =
    pctGrasa > 0 && pctIdeal > 0 ? pctGrasa - pctIdeal : 0;

  const excesoKg =
    peso > 0 && excesoPct !== 0 ? (peso * excesoPct) / 100 : 0;

  const pesoSinExceso =
    peso > 0 && excesoKg !== 0 ? peso - excesoKg : 0;

  return {
    grasaTotalKg,
    excesoPct,
    excesoKg,
    pesoSinExceso,
  };
}, [
  form.peso_actual_kg,
  form.estatura_m,
  form.porcentaje_grasa,
  form.porcentaje_grasa_ideal,
]);


  // % de grasa ideal automático según sexo (24 hombres / 31 mujeres)
  const autoIdealFat = useMemo(() => {
    if (!patientSex) return '';

    const s = String(patientSex).toLowerCase();

    if (s.startsWith('mujer') || s.startsWith('fem') || s === 'f') {
      return 31;
    }
    if (s.startsWith('hombre') || s.startsWith('masc') || s === 'm') {
      return 24;
    }

    return '';
  }, [patientSex]);

  // Rellenar % ideal si está vacío
  useEffect(() => {
    if (autoIdealFat === '') return;

    setForm((prev) => {
      if (
        prev.porcentaje_grasa_ideal &&
        prev.porcentaje_grasa_ideal !== autoIdealFat.toString()
      ) {
        return prev;
      }
      return {
        ...prev,
        porcentaje_grasa_ideal: autoIdealFat.toString(),
      };
    });
  }, [autoIdealFat]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    const { grasaTotalKg } = derived;

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
        : grasaTotalKg || null,
      agua_corporal_l: form.agua_corporal_l
        ? parseFloat(form.agua_corporal_l)
        : null,
      peso_ideal_kg: form.peso_ideal_kg
        ? parseFloat(form.peso_ideal_kg)
        : null,
      imc: form.imc ? parseFloat(form.imc) : null,
      grasa_visceral_puntos: form.grasa_visceral_puntos
        ? parseFloat(form.grasa_visceral_puntos)
        : null,
      agua_ideal_min_l: form.agua_ideal_min_l
        ? parseFloat(form.agua_ideal_min_l)
        : null,
      agua_ideal_max_l: form.agua_ideal_max_l
        ? parseFloat(form.agua_ideal_max_l)
        : null,
      porcentaje_grasa_ideal: form.porcentaje_grasa_ideal
        ? parseFloat(form.porcentaje_grasa_ideal)
        : null,
      // NUEVO: grasa segmentada
      grasa_brazo_izq_kg: form.grasa_brazo_izq_kg
        ? parseFloat(form.grasa_brazo_izq_kg)
        : null,
      grasa_brazo_der_kg: form.grasa_brazo_der_kg
        ? parseFloat(form.grasa_brazo_der_kg)
        : null,
      grasa_pierna_izq_kg: form.grasa_pierna_izq_kg
        ? parseFloat(form.grasa_pierna_izq_kg)
        : null,
      grasa_pierna_der_kg: form.grasa_pierna_der_kg
        ? parseFloat(form.grasa_pierna_der_kg)
        : null,
      grasa_tronco_kg: form.grasa_tronco_kg
        ? parseFloat(form.grasa_tronco_kg)
        : null,
      // NUEVO: masa muscular segmentada
      masa_brazo_izq_kg: form.masa_brazo_izq_kg
        ? parseFloat(form.masa_brazo_izq_kg)
        : null,
      masa_brazo_der_kg: form.masa_brazo_der_kg
        ? parseFloat(form.masa_brazo_der_kg)
        : null,
      masa_pierna_izq_kg: form.masa_pierna_izq_kg
        ? parseFloat(form.masa_pierna_izq_kg)
        : null,
      masa_pierna_der_kg: form.masa_pierna_der_kg
        ? parseFloat(form.masa_pierna_der_kg)
        : null,
      masa_tronco_kg: form.masa_tronco_kg
        ? parseFloat(form.masa_tronco_kg)
        : null,
    };

    const { data, error } = await supabase
      .from('inbody_records')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error(error);
      setMsg('Error al guardar registro InBody');
    } else {
      setRecords((prev) => [data, ...prev]);
      setMsg('Registro InBody agregado');
    }
    setSaving(false);
  };

  if (loading) return <div>Cargando registros InBody...</div>;

  const {
    grasaTotalKg,
    excesoPct,
    excesoKg,
    pesoSinExceso,
  } = derived;

  return (
    <div className="inbody-tab">
      {/* FORMULARIO PRINCIPAL */}
      <form onSubmit={handleSave} className="inbody-form">
        <h3>Evaluación de composición corporal</h3>

        <label>
          Peso actual (kg):
          <input
            type="number"
            step="0.1"
            name="peso_kg"
            value={form.peso_kg}
            onChange={handleChange}
          />
        </label>

        <label>
          Fecha de sesión:
          <input
            type="date"
            name="fecha"
            value={form.fecha}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          IMC actual:
          <input
            type="number"
            step="0.1"
            name="imc"
            value={form.imc}
            onChange={handleChange}
          />
        </label>

        <label>
          Peso ideal (kg) <small>(editable)</small>:
          <input
            type="number"
            step="0.1"
            name="peso_ideal_kg"
            value={form.peso_ideal_kg}
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

        <label>
          Grasa visceral (puntos):
          <input
            type="number"
            step="1"
            name="grasa_visceral_puntos"
            value={form.grasa_visceral_puntos}
            onChange={handleChange}
          />
        </label>

        <label>
          Rango ideal de agua - mínimo (L):
          <input
            type="number"
            step="0.1"
            name="agua_ideal_min_l"
            value={form.agua_ideal_min_l}
            onChange={handleChange}
          />
        </label>

        <label>
          Rango ideal de agua - máximo (L):
          <input
            type="number"
            step="0.1"
            name="agua_ideal_max_l"
            value={form.agua_ideal_max_l}
            onChange={handleChange}
          />
        </label>

        <label>
          % de masa grasa actual:
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
          Masa muscular total (kg):
          <input
            type="number"
            step="0.1"
            name="masa_muscular_kg"
            value={form.masa_muscular_kg}
            onChange={handleChange}
          />
        </label>

        <label>
          % de grasa ideal usado en el cálculo
          <small> (se llena según sexo, puedes editarlo)</small>:
          <input
            type="number"
            step="0.1"
            name="porcentaje_grasa_ideal"
            value={form.porcentaje_grasa_ideal}
            onChange={handleChange}
          />
        </label>

        {/* NUEVO: GRASA SEGMENTADA */}
        <div style={{ gridColumn: '1 / -1', marginTop: 16 }}>
          <h4>Grasa segmentada (kg)</h4>
        </div>

        <label>
          Brazo izquierdo (kg):
          <input
            type="number"
            step="0.1"
            name="grasa_brazo_izq_kg"
            value={form.grasa_brazo_izq_kg}
            onChange={handleChange}
          />
        </label>

        <label>
          Brazo derecho (kg):
          <input
            type="number"
            step="0.1"
            name="grasa_brazo_der_kg"
            value={form.grasa_brazo_der_kg}
            onChange={handleChange}
          />
        </label>

        <label>
          Pierna izquierda (kg):
          <input
            type="number"
            step="0.1"
            name="grasa_pierna_izq_kg"
            value={form.grasa_pierna_izq_kg}
            onChange={handleChange}
          />
        </label>

        <label>
          Pierna derecha (kg):
          <input
            type="number"
            step="0.1"
            name="grasa_pierna_der_kg"
            value={form.grasa_pierna_der_kg}
            onChange={handleChange}
          />
        </label>

        <label>
          Tronco / torso (kg):
          <input
            type="number"
            step="0.1"
            name="grasa_tronco_kg"
            value={form.grasa_tronco_kg}
            onChange={handleChange}
          />
        </label>

        {/* NUEVO: MASA MUSCULAR SEGMENTADA */}
        <div style={{ gridColumn: '1 / -1', marginTop: 16 }}>
          <h4>Masa muscular segmentada (kg)</h4>
        </div>

        <label>
          Brazo izquierdo (kg):
          <input
            type="number"
            step="0.1"
            name="masa_brazo_izq_kg"
            value={form.masa_brazo_izq_kg}
            onChange={handleChange}
          />
        </label>

        <label>
          Brazo derecho (kg):
          <input
            type="number"
            step="0.1"
            name="masa_brazo_der_kg"
            value={form.masa_brazo_der_kg}
            onChange={handleChange}
          />
        </label>

        <label>
          Pierna izquierda (kg):
          <input
            type="number"
            step="0.1"
            name="masa_pierna_izq_kg"
            value={form.masa_pierna_izq_kg}
            onChange={handleChange}
          />
        </label>

        <label>
          Pierna derecha (kg):
          <input
            type="number"
            step="0.1"
            name="masa_pierna_der_kg"
            value={form.masa_pierna_der_kg}
            onChange={handleChange}
          />
        </label>

        <label>
          Tronco / torso (kg):
          <input
            type="number"
            step="0.1"
            name="masa_tronco_kg"
            value={form.masa_tronco_kg}
            onChange={handleChange}
          />
        </label>

        <button type="submit" disabled={saving}>
          {saving ? 'Guardando...' : 'Agregar registro InBody'}
        </button>

        {msg && <p className="info">{msg}</p>}
      </form>

      {/* CÁLCULOS DERIVADOS */}
      <section style={{ marginTop: 16, marginBottom: 16 }}>
        <h3>Cálculos de grasa corporal (auto)</h3>
        <p style={{ fontSize: '0.9rem', color: '#9ca3af' }}>
          Se calculan a partir de peso actual, % de grasa actual y % de grasa
          ideal.
        </p>

        <div className="inbody-form">
          <label>
            Grasa corporal total (kg):
            <input
              type="number"
              readOnly
              value={grasaTotalKg ? grasaTotalKg.toFixed(2) : ''}
            />
          </label>

          <label>
            Exceso de grasa (%):
            <input
              type="number"
              readOnly
              value={
                excesoPct || excesoPct === 0
                  ? excesoPct.toFixed(2)
                  : ''
              }
            />
          </label>

          <label>
            Exceso de grasa (kg):
            <input
              type="number"
              readOnly
              value={excesoKg ? excesoKg.toFixed(2) : ''}
            />
          </label>

          <label>
            Peso esperado sin exceso de grasa (kg):
            <input
              type="number"
              readOnly
              value={pesoSinExceso ? pesoSinExceso.toFixed(2) : ''}
            />
          </label>
        </div>
      </section>

      {/* METAS (resumen) */}
      <section style={{ marginTop: 8, marginBottom: 20 }}>
        <h3>Metas del paciente (resumen)</h3>
        {goals ? (
          <div className="inbody-form">
            <label>
              Peso objetivo (kg):
              <input
                type="number"
                readOnly
                value={goals.peso_objetivo_kg ?? ''}
              />
            </label>
            <label>
              Masa muscular objetivo (kg):
              <input
                type="number"
                readOnly
                value={goals.masa_muscular_objetivo_kg ?? ''}
              />
            </label>
            <label>
              % grasa objetivo:
              <input
                type="number"
                readOnly
                value={goals.porcentaje_grasa_objetivo ?? ''}
              />
            </label>
            <label>
              Notas:
              <textarea readOnly value={goals.notas || ''} rows={2} />
            </label>
          </div>
        ) : (
          <p style={{ fontSize: '0.9rem', color: '#9ca3af' }}>
            Aún no hay metas registradas. Puedes capturarlas en la pestaña
            "Metas".
          </p>
        )}
      </section>

      {/* HISTORIAL INBODY */}
      <h3>Historial de sesiones InBody</h3>
      {records.length === 0 && <p>Sin registros aún.</p>}

      <table className="inbody-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Peso</th>
            <th>M. muscular</th>
            <th>% Grasa</th>
            <th>M. grasa (kg)</th>
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
