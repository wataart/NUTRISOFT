// src/components/NutritionCalcTab.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function NutritionCalcTab({ patientId }) {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({
    fecha: '',
    sexo: 'mujer', // 'hombre' | 'mujer'
    peso_kg: '',
    estatura_cm: '',
    edad: '',
    formula: 'Mifflin St. Jeor',
    actividad: 'sedentario', // muy_sedentario, sedentario, activo, muy_activo
    ajuste_tipo: 'mantenimiento', // deficit, mantenimiento, superavit
    ajuste_calorias: '',
    porcentaje_carbohidratos: '45',
    porcentaje_proteinas: '25',
    porcentaje_lipidos: '30',
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
    setMsg('');
  };

  // Cálculos según el PDF (Mifflin, 10% TEF, factor actividad, déficit/superávit, macros)
  const calculated = useMemo(() => {
    const peso = parseFloat(form.peso_kg) || 0;
    const estatura = parseFloat(form.estatura_cm) || 0;
    const edad = parseFloat(form.edad) || 0;

    const pCho = parseFloat(form.porcentaje_carbohidratos) || 0;
    const pProt = parseFloat(form.porcentaje_proteinas) || 0;
    const pFat = parseFloat(form.porcentaje_lipidos) || 0;

    // Fórmula de Mifflin St. Jeor
    let geb = 0;
    if (peso > 0 && estatura > 0 && edad > 0) {
      if (form.sexo === 'hombre') {
        geb = 10 * peso + 6.25 * estatura - 5 * edad + 5;
      } else {
        geb = 10 * peso + 6.25 * estatura - 5 * edad - 161;
      }
    }

    // Efecto termogénico (10%)
    const efectoTermogenico = geb * 0.1;

    // Factor de actividad
    let factorActividad = 1;
    switch (form.actividad) {
      case 'muy_sedentario':
        factorActividad = 1.1;
        break;
      case 'sedentario':
        factorActividad = 1.15;
        break;
      case 'activo':
        factorActividad = 1.2;
        break;
      case 'muy_activo':
        factorActividad = 1.3;
        break;
      default:
        factorActividad = 1.15;
    }

    // Gasto energético total (GET) sin TEF
    const getSinTEF = geb * factorActividad;

    // Sumar TEF (10%)
    const getConTEF = getSinTEF + efectoTermogenico;

    // Ajuste por déficit / superávit / mantenimiento
    const ajuste = parseFloat(form.ajuste_calorias) || 0;
    let caloriasObjetivo = getConTEF;

    if (form.ajuste_tipo === 'deficit') {
      caloriasObjetivo = getConTEF - ajuste;
    } else if (form.ajuste_tipo === 'superavit') {
      caloriasObjetivo = getConTEF + ajuste;
    }

    // Macros por % a partir de calorías objetivo
    const sumaPct = pCho + pProt + pFat || 1; // evitar /0
    const factorPct = sumaPct !== 100 ? 100 / sumaPct : 1;

    const pctCarbReal = pCho * factorPct;
    const pctProtReal = pProt * factorPct;
    const pctFatReal = pFat * factorPct;

    const kcalCarb = (caloriasObjetivo * pctCarbReal) / 100;
    const kcalProt = (caloriasObjetivo * pctProtReal) / 100;
    const kcalFat = (caloriasObjetivo * pctFatReal) / 100;

    const gCarb = kcalCarb / 4;
    const gProt = kcalProt / 4;
    const gFat = kcalFat / 9;

    const kcalPorKg = peso > 0 ? caloriasObjetivo / peso : 0;
    const gCarbKg = peso > 0 ? gCarb / peso : 0;
    const gProtKg = peso > 0 ? gProt / peso : 0;
    const gFatKg = peso > 0 ? gFat / peso : 0;

    const resumenTexto = `
Calorías objetivo: ${caloriasObjetivo.toFixed(1)} kcal
Carbohidratos: ${gCarb.toFixed(1)} g (${pctCarbReal.toFixed(
      1
    )}%, ${gCarbKg.toFixed(2)} g/kg)
Proteínas: ${gProt.toFixed(1)} g (${pctProtReal.toFixed(
      1
    )}%, ${gProtKg.toFixed(2)} g/kg)
Lípidos: ${gFat.toFixed(1)} g (${pctFatReal.toFixed(
      1
    )}%, ${gFatKg.toFixed(2)} g/kg)
`.trim();

    return {
      geb,
      efectoTermogenico,
      factorActividad,
      getSinTEF,
      getConTEF,
      caloriasObjetivo,
      pctCarbReal,
      pctProtReal,
      pctFatReal,
      gCarb,
      gProt,
      gFat,
      kcalPorKg,
      gCarbKg,
      gProtKg,
      gFatKg,
      resumenTexto,
    };
  }, [form]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    const {
      geb,
      factorActividad,
      caloriasObjetivo,
      resumenTexto,
    } = calculated;

    const payload = {
      patient_id: patientId,
      fecha: form.fecha,
      formula: form.formula,
      geb: geb || null,
      get: caloriasObjetivo || null, // guardamos calorías objetivo como "GET" usado para el menú
      actividad_factor: factorActividad || null,
      cuadro_dietosintetico: resumenTexto,
    };

    const { data, error } = await supabase
      .from('nutrition_calculations')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error(error);
      setMsg('Error al guardar cálculo');
      setSaving(false);
      return;
    }

    setRecords((prev) => [data, ...prev]);
    setMsg('Cálculo nutricional guardado');
    setSaving(false);
  };

  if (loading) return <div>Cargando cálculos...</div>;

  const {
    geb,
    efectoTermogenico,
    getSinTEF,
    getConTEF,
    caloriasObjetivo,
    pctCarbReal,
    pctProtReal,
    pctFatReal,
    gCarb,
    gProt,
    gFat,
    kcalPorKg,
    gCarbKg,
    gProtKg,
    gFatKg,
  } = calculated;

  return (
    <div className="nutrition-tab">
      <form className="nutrition-form" onSubmit={handleSave}>
        <h3>Cálculo nutricional (Mifflin + actividad)</h3>

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
          Sexo:
          <select
            name="sexo"
            value={form.sexo}
            onChange={handleChange}
          >
            <option value="mujer">Mujer</option>
            <option value="hombre">Hombre</option>
          </select>
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
          Estatura (cm):
          <input
            type="number"
            step="0.1"
            name="estatura_cm"
            value={form.estatura_cm}
            onChange={handleChange}
          />
        </label>

        <label>
          Edad (años):
          <input
            type="number"
            name="edad"
            value={form.edad}
            onChange={handleChange}
          />
        </label>

        <label>
          Fórmula:
          <input
            type="text"
            name="formula"
            value={form.formula}
            onChange={handleChange}
          />
        </label>

        <label>
          Actividad física:
          <select
            name="actividad"
            value={form.actividad}
            onChange={handleChange}
          >
            <option value="muy_sedentario">
              Muy sedentario (10% - x1.1)
            </option>
            <option value="sedentario">
              Sedentario (15% - x1.15)
            </option>
            <option value="activo">
              Activo (20% - x1.2)
            </option>
            <option value="muy_activo">
              Muy activo (30% - x1.3)
            </option>
          </select>
        </label>

        <label>
          Tipo de ajuste:
          <select
            name="ajuste_tipo"
            value={form.ajuste_tipo}
            onChange={handleChange}
          >
            <option value="mantenimiento">Mantenimiento</option>
            <option value="deficit">Déficit</option>
            <option value="superavit">Superávit</option>
          </select>
        </label>

        <label>
          Calorías a restar/sumar:
          <input
            type="number"
            name="ajuste_calorias"
            value={form.ajuste_calorias}
            onChange={handleChange}
            placeholder="Ej. 300"
          />
        </label>

        <label>
          % carbohidratos:
          <input
            type="number"
            name="porcentaje_carbohidratos"
            value={form.porcentaje_carbohidratos}
            onChange={handleChange}
          />
        </label>

        <label>
          % proteínas:
          <input
            type="number"
            name="porcentaje_proteinas"
            value={form.porcentaje_proteinas}
            onChange={handleChange}
          />
        </label>

        <label>
          % lípidos:
          <input
            type="number"
            name="porcentaje_lipidos"
            value={form.porcentaje_lipidos}
            onChange={handleChange}
          />
        </label>

        {/* RESUMEN CALCULADO */}
        <div
          style={{
            gridColumn: '1 / -1',
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            border: '1px solid #374151',
            background: '#020617',
            fontSize: '0.85rem',
          }}
        >
          <h4 style={{ marginTop: 0 }}>Resultados del cálculo</h4>
          <p>
            <strong>Gasto energético basal (GEB):</strong>{' '}
            {geb ? geb.toFixed(2) : '-'} kcal
          </p>
          <p>
            <strong>Efecto termogénico (10%):</strong>{' '}
            {efectoTermogenico ? efectoTermogenico.toFixed(2) : '-'} kcal
          </p>
          <p>
            <strong>GET según actividad (sin TEF):</strong>{' '}
            {getSinTEF ? getSinTEF.toFixed(2) : '-'} kcal
            <br />
            <strong>GET + TEF:</strong>{' '}
            {getConTEF ? getConTEF.toFixed(2) : '-'} kcal
          </p>
          <p>
            <strong>Calorías objetivo (después de ajuste):</strong>{' '}
            {caloriasObjetivo ? caloriasObjetivo.toFixed(2) : '-'} kcal
          </p>

          <p>
            <strong>Distribución de macros:</strong>
            <br />
            CHO: {pctCarbReal.toFixed(1)}% →{' '}
            {gCarb.toFixed(1)} g
            <br />
            PROT: {pctProtReal.toFixed(1)}% →{' '}
            {gProt.toFixed(1)} g
            <br />
            LIP: {pctFatReal.toFixed(1)}% →{' '}
            {gFat.toFixed(1)} g
          </p>

          {form.peso_kg && parseFloat(form.peso_kg) > 0 && (
            <>
              <p>
                <strong>Por kg de peso:</strong>
              </p>
              <ul>
                <li>
                  Calorías: {kcalPorKg.toFixed(2)} kcal/kg
                </li>
                <li>
                  CHO: {gCarbKg.toFixed(2)} g/kg
                </li>
                <li>
                  PROT: {gProtKg.toFixed(2)} g/kg
                </li>
                <li>
                  LIP: {gFatKg.toFixed(2)} g/kg
                </li>
              </ul>
            </>
          )}
        </div>

        <button type="submit" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar cálculo'}
        </button>
        {msg && <p className="info">{msg}</p>}
      </form>

      <h3>Historial de cálculos</h3>
      {records.length === 0 && <p>Sin cálculos aún.</p>}

      <table className="nutrition-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Fórmula</th>
            <th>GEB</th>
            <th>Calorías objetivo</th>
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
