// src/components/ClinicalHistoryTab.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

const EMPTY_FORM = {
  motivo_consulta: '',

  // Antecedentes personales
  padecimiento_actual: '',
  otras_enfermedades: '',
  hospitalizaciones: '',
  cirugias: '',

  // Farmacológico y suplementos (texto viejo, por si quieres notas generales)
  farmacos_suplementos: '',
  farmacos_dosis_frecuencia: '',
  farmacos_tiempo_uso: '',
  farmacos_motivo_uso: '',
  farmacos_interaccion: '',

  // Ginecología y obstetricia
  gineco_embarazos: '',
  gineco_hijos: '',
  gineco_cesareas: '',
  gineco_embarazo_actual: '',
  gineco_sdg_referido: '',
  gineco_sdg_fum: '',
  gineco_lactancia_actual: '',
  gineco_anticonceptivos: '',
  gineco_trh: '',

  // Presión arterial
  presion_habitual: '',
  presion_en_consulta: '',

  // Antecedentes patológico-familiares
  antecedentes_familiares: '',

  // Valoración antropométrica - antecedentes de peso
  peso_maximo: '',
  peso_maximo_edad: '',
  peso_minimo: '',
  peso_minimo_edad: '',
  peso_que_le_agrada: '',
  peso_habitual: '',

  // Mediciones antropométricas actuales
  antrop_peso_kg: '',
  antrop_talla_m: '',
  antrop_cintura_cm: '',
  antrop_cadera_cm: '',
  antrop_abdominal_cm: '',
  antropometria_detalle: '',

  // Indicadores nutricionales
  ind_complexion: '',
  ind_grasa_kg: '',
  ind_masa_muscular_kg: '',
  indicadores_nutricionales: '', // notas / resumen libre

  // Valoración bioquímica (resumen / notas)
  valoracion_bioquimica: '',

  // Valoración clínica
  valoracion_clinica: '',

  // Problemas gastrointestinales
  gi_dolor_abdominal: '',
  gi_nauseas: '',
  gi_vomito: '',
  gi_diarrea: '',
  gi_estrenimiento: '',
  gi_gases: '',
  gi_reflujo: '',
  gi_colitis: '',
  gi_ulcera: '',
  gi_gastritis: '',
  gi_otros: '',

  // Experiencias dietéticas
  experiencias_no_tratamientos_previos: '',
  experiencias_edad_inicio: '',
  experiencias_en_que_consistio: '',
  experiencias_resultados: '',

  // Aspectos socioeconómicos
  socio_ingreso_mensual: '',
  socio_porcentaje_alimentos: '',
  socio_num_personas_hogar: '',
  socio_seguro_medico: '',
  socio_religion: '',
  socio_nivel_estres: '',

  // Actitudes
  act_motivacion: '',
  act_barreras: '',
  act_alternativas: '',
  act_importancia_cambio: '',

  // Ambiente de alimentación y comidas
  amb_influencia_estado_animo: '',
  amb_duracion_comidas: '',
  amb_num_comidas_dia: '',
  amb_num_comidas_casa: '',
  amb_num_comidas_fuera: '',
  amb_alimentos_fuera_casa: '',

  // Entre comidas, alergias, preferencias
  snacks_come_entre_comidas: '',
  snacks_que_y_cuando: '',
  alergias_alimentarias: '',
  intolerancias_alimentarias: '',
  alimentos_preferidos: '',
  aversiones_alimentarias: '',
  consumo_agua: '',

  // Cuestionario de frecuencia de alimentos (por grupo)
  frecuencia_frutas: '',
  frecuencia_verduras: '',
  frecuencia_cereales: '',
  frecuencia_leguminosas: '',
  frecuencia_lacteos: '',
  frecuencia_aoa: '', // alimentos de origen animal (general)
  frecuencia_carnes_rojas: '',
  frecuencia_carnes_blancas: '',
  frecuencia_grasas: '',
  frecuencia_azucares: '',
  frecuencia_sustitutos_azucar: '',
  frecuencia_refrescos: '',
  frecuencia_ultraprocesados: '',
  frecuencia_alimentos: '', // resumen global

  // Frecuencia de sustancias
  sustancias_alcohol: '',
  sustancias_cafeina: '',
  sustancias_tabaco: '',
  sustancias_drogas: '',

  // Actividad y función física
  af_realiza_actividad: '',
  af_tipo: '',
  af_duracion: '',
  af_frecuencia_semanal: '',
  af_tiempo_realizado: '',
  af_objetivo: '',

  // Hábitos (sedentarismo, sueño, pantallas)
  hab_horas_sentado: '',
  hab_horas_duerme: '',
  hab_horas_tv: '',
  hab_horas_computadora: '',

  // Actividades día habitual / fin de semana
  actividades_dia_habitual: '',
  actividades_fin_semana: '',

  // Diagnóstico
  diagnostico_nutricional: '',
};

export default function ClinicalHistoryTab({ patientId }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Lista de fármacos / medicamentos
  const [farmacos, setFarmacos] = useState([
    {
      id: 1,
      nombre: '',
      dosis: '',
      frecuencia: '',
      tiempo_uso: '',
      motivo: '',
    },
  ]);

  // Lista de parámetros de valoración bioquímica
  const [bioquimica, setBioquimica] = useState([
    {
      id: 1,
      parametro: '',
      fecha: '',
      resultado: '',
      unidad: '',
      referencia: '',
      interpretacion: '',
    },
  ]);

  // 📐 Cálculos automáticos de IMC, % grasa, % masa muscular e índice C/C
  const derivedAnthro = useMemo(() => {
    const peso = parseFloat(form.antrop_peso_kg) || 0;
    const talla = parseFloat(form.antrop_talla_m) || 0;
    const grasaKg = parseFloat(form.ind_grasa_kg) || 0;
    const masaKg = parseFloat(form.ind_masa_muscular_kg) || 0;
    const cintura = parseFloat(form.antrop_cintura_cm) || 0;
    const cadera = parseFloat(form.antrop_cadera_cm) || 0;

    const imc = peso > 0 && talla > 0 ? peso / (talla * talla) : 0;
    const pctGrasa = peso > 0 && grasaKg > 0 ? (grasaKg * 100) / peso : 0;
    const pctMasa = peso > 0 && masaKg > 0 ? (masaKg * 100) / peso : 0;
    const indiceCc = cintura > 0 && cadera > 0 ? cintura / cadera : 0;

    return { imc, pctGrasa, pctMasa, indiceCc };
  }, [
    form.antrop_peso_kg,
    form.antrop_talla_m,
    form.ind_grasa_kg,
    form.ind_masa_muscular_kg,
    form.antrop_cintura_cm,
    form.antrop_cadera_cm,
  ]);

  const { imc, pctGrasa, pctMasa, indiceCc } = derivedAnthro;

  // Cargar historia clínica (contenido JSON)
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setMsg('');

      const { data, error } = await supabase
        .from('clinical_history')
        .select('id, contenido')
        .eq('patient_id', patientId)
        .single();

      if (error) {
        // PGRST116 = no hay filas, es normal si aún no tiene historia
        if (error.code !== 'PGRST116') {
          console.error(error);
        }
        setRecordId(null);
        setForm(EMPTY_FORM);
        setFarmacos([
          {
            id: 1,
            nombre: '',
            dosis: '',
            frecuencia: '',
            tiempo_uso: '',
            motivo: '',
          },
        ]);
        setBioquimica([
          {
            id: 1,
            parametro: '',
            fecha: '',
            resultado: '',
            unidad: '',
            referencia: '',
            interpretacion: '',
          },
        ]);
      } else if (data) {
        setRecordId(data.id);
        const contenido = data.contenido || {};
        setForm({ ...EMPTY_FORM, ...contenido });

        // Fármacos
        if (Array.isArray(contenido.farmacos) && contenido.farmacos.length) {
          setFarmacos(
            contenido.farmacos.map((f, idx) => ({
              id: idx + 1,
              nombre: f.nombre || '',
              dosis: f.dosis || '',
              frecuencia: f.frecuencia || '',
              tiempo_uso: f.tiempo_uso || '',
              motivo: f.motivo || '',
            }))
          );
        } else {
          setFarmacos([
            {
              id: 1,
              nombre: '',
              dosis: '',
              frecuencia: '',
              tiempo_uso: '',
              motivo: '',
            },
          ]);
        }

        // Bioquímica
        if (Array.isArray(contenido.bioquimica) && contenido.bioquimica.length) {
          setBioquimica(
            contenido.bioquimica.map((b, idx) => ({
              id: idx + 1,
              parametro: b.parametro || '',
              fecha: b.fecha || '',
              resultado: b.resultado || '',
              unidad: b.unidad || '',
              referencia: b.referencia || '',
              interpretacion: b.interpretacion || '',
            }))
          );
        } else {
          setBioquimica([
            {
              id: 1,
              parametro: '',
              fecha: '',
              resultado: '',
              unidad: '',
              referencia: '',
              interpretacion: '',
            },
          ]);
        }
      }

      setLoading(false);
    };

    fetchHistory();
  }, [patientId]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setMsg('');
  };

  // handlers fármacos
  const handleFarmacoChange = (id, field, value) => {
    setFarmacos((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, [field]: value } : f
      )
    );
    setMsg('');
  };

  const addFarmaco = () => {
    setFarmacos((prev) => [
      ...prev,
      {
        id: prev.length ? prev[prev.length - 1].id + 1 : 1,
        nombre: '',
        dosis: '',
        frecuencia: '',
        tiempo_uso: '',
        motivo: '',
      },
    ]);
  };

  const removeFarmaco = (id) => {
    setFarmacos((prev) => prev.filter((f) => f.id !== id));
  };

  // handlers bioquímica
  const handleBioquimicaChange = (id, field, value) => {
    setBioquimica((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, [field]: value } : b
      )
    );
    setMsg('');
  };

  const addBioquimica = () => {
    setBioquimica((prev) => [
      ...prev,
      {
        id: prev.length ? prev[prev.length - 1].id + 1 : 1,
        parametro: '',
        fecha: '',
        resultado: '',
        unidad: '',
        referencia: '',
        interpretacion: '',
      },
    ]);
  };

  const removeBioquimica = (id) => {
    setBioquimica((prev) => prev.filter((b) => b.id !== id));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    const contenidoFinal = {
      ...form,
      farmacos: farmacos.map(({ id, ...rest }) => rest),
      bioquimica: bioquimica.map(({ id, ...rest }) => rest),
      indicadores_calculados: {
        imc,
        porcentaje_grasa_total: pctGrasa,
        porcentaje_masa_muscular_total: pctMasa,
        indice_cintura_cadera: indiceCc,
      },
    };

    const payload = {
      id: recordId || undefined,
      patient_id: patientId,
      contenido: contenidoFinal,
    };

    const { data, error } = await supabase
      .from('clinical_history')
      .upsert(payload, { onConflict: 'patient_id' })
      .select('id')
      .single();

    if (error) {
      console.error(error);
      setMsg('Error al guardar historia clínica');
      setSaving(false);
      return;
    }

    setRecordId(data.id);
    setMsg('Historia clínica guardada');
    setSaving(false);
  };

  if (loading) return <div>Cargando historia clínica...</div>;

  return (
    <form className="clinical-form" onSubmit={handleSave}>
      {/* MOTIVO DE CONSULTA */}
      <h3 style={{ gridColumn: '1 / -1' }}>Historia clínica</h3>

      <label style={{ gridColumn: '1 / -1' }}>
        Motivo de consulta
        <textarea
          rows={3}
          value={form.motivo_consulta}
          onChange={(e) =>
            handleChange('motivo_consulta', e.target.value)
          }
        />
      </label>

      {/* ANTECEDENTES PERSONALES */}
      <h4 style={{ gridColumn: '1 / -1' }}>
        Antecedentes patológicos personales
      </h4>

      <label>
        Padecimiento actual
        <textarea
          rows={2}
          value={form.padecimiento_actual}
          onChange={(e) =>
            handleChange('padecimiento_actual', e.target.value)
          }
        />
      </label>

      <label>
        Otras enfermedades
        <textarea
          rows={2}
          value={form.otras_enfermedades}
          onChange={(e) =>
            handleChange('otras_enfermedades', e.target.value)
          }
        />
      </label>

      <label>
        Hospitalizaciones
        <textarea
          rows={2}
          value={form.hospitalizaciones}
          onChange={(e) =>
            handleChange('hospitalizaciones', e.target.value)
          }
        />
      </label>

      <label>
        Cirugías
        <textarea
          rows={2}
          value={form.cirugias}
          onChange={(e) =>
            handleChange('cirugias', e.target.value)
          }
        />
      </label>

      {/* FARMACOS Y SUPLEMENTOS */}
      <h4 style={{ gridColumn: '1 / -1' }}>
        Tratamiento farmacológico y suplementos
      </h4>

      {/* Tabla de fármacos */}
      <section style={{ gridColumn: '1 / -1' }}>
        <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
          Agrega cada medicamento por separado con su dosis, frecuencia, tiempo de uso y motivo.
        </p>

        <table className="menu-items-table">
          <thead>
            <tr>
              <th>Nombre del fármaco</th>
              <th>Dosis</th>
              <th>Frecuencia</th>
              <th>Tiempo de uso</th>
              <th>Motivo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {farmacos.map((f) => (
              <tr key={f.id}>
                <td>
                  <input
                    type="text"
                    value={f.nombre}
                    onChange={(e) =>
                      handleFarmacoChange(f.id, 'nombre', e.target.value)
                    }
                    placeholder="Ej. Metformina"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={f.dosis}
                    onChange={(e) =>
                      handleFarmacoChange(f.id, 'dosis', e.target.value)
                    }
                    placeholder="Ej. 850 mg"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={f.frecuencia}
                    onChange={(e) =>
                      handleFarmacoChange(f.id, 'frecuencia', e.target.value)
                    }
                    placeholder="Ej. cada 12 h"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={f.tiempo_uso}
                    onChange={(e) =>
                      handleFarmacoChange(f.id, 'tiempo_uso', e.target.value)
                    }
                    placeholder="Ej. 2 años"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={f.motivo}
                    onChange={(e) =>
                      handleFarmacoChange(f.id, 'motivo', e.target.value)
                    }
                    placeholder="Ej. DM2, HTA, etc."
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => removeFarmaco(f.id)}
                  >
                    X
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          type="button"
          style={{ marginTop: 8 }}
          onClick={addFarmaco}
        >
          + Agregar fármaco
        </button>
      </section>

      <label style={{ gridColumn: '1 / -1' }}>
        Interacción fármaco-nutriente
        <textarea
          rows={2}
          value={form.farmacos_interaccion}
          onChange={(e) =>
            handleChange('farmacos_interaccion', e.target.value)
          }
        />
      </label>

      {/* GINECOLOGÍA Y OBSTETRICIA */}
      <h4 style={{ gridColumn: '1 / -1' }}>
        Ginecología y obstetricia
      </h4>

      <label>
        Número de embarazos
        <input
          type="text"
          value={form.gineco_embarazos}
          onChange={(e) =>
            handleChange('gineco_embarazos', e.target.value)
          }
        />
      </label>

      <label>
        Hijos
        <input
          type="text"
          value={form.gineco_hijos}
          onChange={(e) =>
            handleChange('gineco_hijos', e.target.value)
          }
        />
      </label>

      <label>
        Cesáreas
        <input
          type="text"
          value={form.gineco_cesareas}
          onChange={(e) =>
            handleChange('gineco_cesareas', e.target.value)
          }
        />
      </label>

      <label>
        Embarazo actual
        <input
          type="text"
          value={form.gineco_embarazo_actual}
          onChange={(e) =>
            handleChange('gineco_embarazo_actual', e.target.value)
          }
        />
      </label>

      <label>
        SDG referido por paciente
        <input
          type="text"
          value={form.gineco_sdg_referido}
          onChange={(e) =>
            handleChange('gineco_sdg_referido', e.target.value)
          }
        />
      </label>

      <label>
        SDG por FUM
        <input
          type="text"
          value={form.gineco_sdg_fum}
          onChange={(e) =>
            handleChange('gineco_sdg_fum', e.target.value)
          }
        />
      </label>

      <label>
        Lactancia actual
        <input
          type="text"
          value={form.gineco_lactancia_actual}
          onChange={(e) =>
            handleChange('gineco_lactancia_actual', e.target.value)
          }
        />
      </label>

      <label>
        Uso de anticonceptivos hormonales
        <input
          type="text"
          value={form.gineco_anticonceptivos}
          onChange={(e) =>
            handleChange('gineco_anticonceptivos', e.target.value)
          }
        />
      </label>

      <label style={{ gridColumn: '1 / -1' }}>
        Terapia de reemplazo hormonal
        <input
          type="text"
          value={form.gineco_trh}
          onChange={(e) =>
            handleChange('gineco_trh', e.target.value)
          }
        />
      </label>

      {/* PRESIÓN ARTERIAL */}
      <h4 style={{ gridColumn: '1 / -1' }}>Presión arterial</h4>

      <label>
        Presión arterial habitual
        <input
          type="text"
          value={form.presion_habitual}
          onChange={(e) =>
            handleChange('presion_habitual', e.target.value)
          }
        />
      </label>

      <label>
        Toma de presión en consulta
        <input
          type="text"
          value={form.presion_en_consulta}
          onChange={(e) =>
            handleChange('presion_en_consulta', e.target.value)
          }
        />
      </label>

      {/* ANTECEDENTES FAMILIARES */}
      <h4 style={{ gridColumn: '1 / -1' }}>
        Antecedentes patológico-familiares
      </h4>

      <label style={{ gridColumn: '1 / -1' }}>
        Detalle (sobrepeso/obesidad, DM1, HTA, etc.)
        <textarea
          rows={4}
          value={form.antecedentes_familiares}
          onChange={(e) =>
            handleChange('antecedentes_familiares', e.target.value)
          }
        />
      </label>

      {/* VALORACIÓN ANTROPOMÉTRICA */}
      <h4 style={{ gridColumn: '1 / -1' }}>
        Valoración antropométrica
      </h4>

      <label>
        Peso máximo (kg) / edad
        <input
          type="text"
          value={form.peso_maximo}
          onChange={(e) =>
            handleChange('peso_maximo', e.target.value)
          }
          placeholder="Ej. 85 kg a los 25 años"
        />
      </label>

      <label>
        Peso mínimo (kg) / edad
        <input
          type="text"
          value={form.peso_minimo}
          onChange={(e) =>
            handleChange('peso_minimo', e.target.value)
          }
          placeholder="Ej. 50 kg a los 18 años"
        />
      </label>

      <label>
        Peso que le agrada
        <input
          type="text"
          value={form.peso_que_le_agrada}
          onChange={(e) =>
            handleChange('peso_que_le_agrada', e.target.value)
          }
        />
      </label>

      <label>
        Peso habitual
        <input
          type="text"
          value={form.peso_habitual}
          onChange={(e) =>
            handleChange('peso_habitual', e.target.value)
          }
        />
      </label>

      {/* Mediciones antropométricas actuales */}
      <h5 style={{ gridColumn: '1 / -1', marginTop: 8 }}>
        Mediciones antropométricas actuales
      </h5>

      <label>
        Peso actual (kg)
        <input
          type="number"
          step="0.1"
          value={form.antrop_peso_kg}
          onChange={(e) =>
            handleChange('antrop_peso_kg', e.target.value)
          }
        />
      </label>

      <label>
        Talla / estatura (m)
        <input
          type="number"
          step="0.01"
          value={form.antrop_talla_m}
          onChange={(e) =>
            handleChange('antrop_talla_m', e.target.value)
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

      <label>
        Cintura (cm)
        <input
          type="number"
          step="0.1"
          value={form.antrop_cintura_cm}
          onChange={(e) =>
            handleChange('antrop_cintura_cm', e.target.value)
          }
        />
      </label>

      <label>
        Cadera (cm)
        <input
          type="number"
          step="0.1"
          value={form.antrop_cadera_cm}
          onChange={(e) =>
            handleChange('antrop_cadera_cm', e.target.value)
          }
        />
      </label>

      <label>
        Circunferencia abdominal (cm)
        <input
          type="number"
          step="0.1"
          value={form.antrop_abdominal_cm}
          onChange={(e) =>
            handleChange('antrop_abdominal_cm', e.target.value)
          }
        />
      </label>

      <label style={{ gridColumn: '1 / -1' }}>
        Detalle de mediciones antropométricas
        <textarea
          rows={4}
          placeholder="Peso, pliegues, otras circunferencias, observaciones, etc."
          value={form.antropometria_detalle}
          onChange={(e) =>
            handleChange('antropometria_detalle', e.target.value)
          }
        />
      </label>

      {/* INDICADORES NUTRICIONALES */}
      <h4 style={{ gridColumn: '1 / -1' }}>
        Indicadores nutricionales
      </h4>

      <label>
        Complexión
        <input
          type="text"
          value={form.ind_complexion}
          onChange={(e) =>
            handleChange('ind_complexion', e.target.value)
          }
          placeholder="Pequeña / media / grande, etc."
        />
      </label>

      <label>
        Grasa corporal total (kg)
        <input
          type="number"
          step="0.1"
          value={form.ind_grasa_kg}
          onChange={(e) =>
            handleChange('ind_grasa_kg', e.target.value)
          }
        />
      </label>

      <label>
        % de grasa corporal total
        <input
          type="number"
          step="0.1"
          value={pctGrasa ? pctGrasa.toFixed(1) : ''}
          readOnly
        />
        <small style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af' }}>
          Se calcula automáticamente: (kg de masa grasa × 100 / peso total).
        </small>
      </label>

      <label>
        Masa muscular total (kg)
        <input
          type="number"
          step="0.1"
          value={form.ind_masa_muscular_kg}
          onChange={(e) =>
            handleChange('ind_masa_muscular_kg', e.target.value)
          }
        />
      </label>

      <label>
        % de masa muscular total
        <input
          type="number"
          step="0.1"
          value={pctMasa ? pctMasa.toFixed(1) : ''}
          readOnly
        />
        <small style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af' }}>
          Se calcula automáticamente: (kg de masa muscular × 100 / peso total).
        </small>
      </label>

      <label>
        Índice cintura–cadera
        <input
          type="number"
          step="0.01"
          value={indiceCc ? indiceCc.toFixed(2) : ''}
          readOnly
        />
        <small style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af' }}>
          Se calcula automáticamente: cintura (cm) / cadera (cm).
        </small>
      </label>

      <label style={{ gridColumn: '1 / -1' }}>
        Resumen de indicadores nutricionales
        <textarea
          rows={4}
          value={form.indicadores_nutricionales}
          onChange={(e) =>
            handleChange(
              'indicadores_nutricionales',
              e.target.value
            )
          }
          placeholder="Interpretación global: estado nutricio, riesgo cardiometabólico, etc."
        />
      </label>

      {/* VALORACIÓN BIOQUÍMICA */}
      <h4 style={{ gridColumn: '1 / -1' }}>
        Valoración bioquímica
      </h4>

      <section style={{ gridColumn: '1 / -1' }}>
        <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
          Registra cada parámetro de laboratorio por separado con fecha, resultado, unidad, valores de referencia e interpretación.
        </p>

        <table className="menu-items-table">
          <thead>
            <tr>
              <th>Parámetro</th>
              <th>Fecha</th>
              <th>Resultado</th>
              <th>Unidad</th>
              <th>Valores de referencia</th>
              <th>Interpretación</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {bioquimica.map((b) => (
              <tr key={b.id}>
                <td>
                  <input
                    type="text"
                    value={b.parametro}
                    onChange={(e) =>
                      handleBioquimicaChange(b.id, 'parametro', e.target.value)
                    }
                    placeholder="Ej. Glucosa, HbA1c, Colesterol"
                  />
                </td>
                <td>
                  <input
                    type="date"
                    value={b.fecha}
                    onChange={(e) =>
                      handleBioquimicaChange(b.id, 'fecha', e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={b.resultado}
                    onChange={(e) =>
                      handleBioquimicaChange(b.id, 'resultado', e.target.value)
                    }
                    placeholder="Ej. 95"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={b.unidad}
                    onChange={(e) =>
                      handleBioquimicaChange(b.id, 'unidad', e.target.value)
                    }
                    placeholder="Ej. mg/dL"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={b.referencia}
                    onChange={(e) =>
                      handleBioquimicaChange(b.id, 'referencia', e.target.value)
                    }
                    placeholder="Ej. 70–99 mg/dL"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={b.interpretacion}
                    onChange={(e) =>
                      handleBioquimicaChange(
                        b.id,
                        'interpretacion',
                        e.target.value
                      )
                    }
                    placeholder="Ej. Normal, alterado, etc."
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => removeBioquimica(b.id)}
                  >
                    X
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          type="button"
          style={{ marginTop: 8 }}
          onClick={addBioquimica}
        >
          + Agregar parámetro
        </button>
      </section>

      <label style={{ gridColumn: '1 / -1' }}>
        Notas / resumen de valoración bioquímica
        <textarea
          rows={4}
          value={form.valoracion_bioquimica}
          onChange={(e) =>
            handleChange('valoracion_bioquimica', e.target.value)
          }
        />
      </label>

      {/* VALORACIÓN CLÍNICA */}
      <h4 style={{ gridColumn: '1 / -1' }}>
        Valoración clínica (signos físicos)
      </h4>

      <label style={{ gridColumn: '1 / -1' }}>
        Ojos, cabello, uñas, labios, mucosas, piel, abdomen, etc.
        <textarea
          rows={4}
          value={form.valoracion_clinica}
          onChange={(e) =>
            handleChange('valoracion_clinica', e.target.value)
          }
        />
      </label>

      {/* PROBLEMAS GASTROINTESTINALES */}
      <h4 style={{ gridColumn: '1 / -1' }}>
        Problemas gastrointestinales
      </h4>

      <label>
        Dolor abdominal
        <input
          type="text"
          value={form.gi_dolor_abdominal}
          onChange={(e) =>
            handleChange('gi_dolor_abdominal', e.target.value)
          }
        />
      </label>

      <label>
        Náuseas
        <input
          type="text"
          value={form.gi_nauseas}
          onChange={(e) =>
            handleChange('gi_nauseas', e.target.value)
          }
        />
      </label>

      <label>
        Vómito
        <input
          type="text"
          value={form.gi_vomito}
          onChange={(e) =>
            handleChange('gi_vomito', e.target.value)
          }
        />
      </label>

      <label>
        Diarrea
        <input
          type="text"
          value={form.gi_diarrea}
          onChange={(e) =>
            handleChange('gi_diarrea', e.target.value)
          }
        />
      </label>

      <label>
        Estreñimiento
        <input
          type="text"
          value={form.gi_estrenimiento}
          onChange={(e) =>
            handleChange('gi_estrenimiento', e.target.value)
          }
        />
      </label>

      <label>
        Gases
        <input
          type="text"
          value={form.gi_gases}
          onChange={(e) =>
            handleChange('gi_gases', e.target.value)
          }
        />
      </label>

      <label>
        Reflujo
        <input
          type="text"
          value={form.gi_reflujo}
          onChange={(e) =>
            handleChange('gi_reflujo', e.target.value)
          }
        />
      </label>

      <label>
        Colitis / úlcera / gastritis / otros
        <textarea
          rows={2}
          value={form.gi_otros}
          onChange={(e) =>
            handleChange('gi_otros', e.target.value)
          }
        />
      </label>

      {/* EXPERIENCIAS DIETÉTICAS */}
      <h4 style={{ gridColumn: '1 / -1' }}>
        Experiencias dietéticas
      </h4>

      <label>
        No. de tratamientos anteriores
        <input
          type="text"
          value={form.experiencias_no_tratamientos_previos}
          onChange={(e) =>
            handleChange(
              'experiencias_no_tratamientos_previos',
              e.target.value
            )
          }
        />
      </label>

      <label>
        Edad de inicio de tratamiento
        <input
          type="text"
          value={form.experiencias_edad_inicio}
          onChange={(e) =>
            handleChange(
              'experiencias_edad_inicio',
              e.target.value
            )
          }
        />
      </label>

      <label style={{ gridColumn: '1 / -1' }}>
        ¿En qué consistió? / Resultados
        <textarea
          rows={3}
          value={form.experiencias_en_que_consistio}
          onChange={(e) =>
            handleChange(
              'experiencias_en_que_consistio',
              e.target.value
            )
          }
          placeholder="Describe brevemente los tratamientos y sus resultados."
        />
      </label>

      {/* ASPECTOS SOCIOECONÓMICOS */}
      <h4 style={{ gridColumn: '1 / -1' }}>
        Aspectos socioeconómicos
      </h4>

      <label>
        Ingreso mensual
        <input
          type="text"
          value={form.socio_ingreso_mensual}
          onChange={(e) =>
            handleChange('socio_ingreso_mensual', e.target.value)
          }
        />
      </label>

      <label>
        % usado en alimentos
        <input
          type="text"
          value={form.socio_porcentaje_alimentos}
          onChange={(e) =>
            handleChange(
              'socio_porcentaje_alimentos',
              e.target.value
            )
          }
        />
      </label>

      <label>
        No. de personas en el hogar
        <input
          type="text"
          value={form.socio_num_personas_hogar}
          onChange={(e) =>
            handleChange(
              'socio_num_personas_hogar',
              e.target.value
            )
          }
        />
      </label>

      <label>
        Seguro médico
        <input
          type="text"
          value={form.socio_seguro_medico}
          onChange={(e) =>
            handleChange('socio_seguro_medico', e.target.value)
          }
        />
      </label>

      <label>
        Religión
        <input
          type="text"
          value={form.socio_religion}
          onChange={(e) =>
            handleChange('socio_religion', e.target.value)
          }
        />
      </label>

      <label>
        Nivel de estrés diario (1–10)
        <input
          type="text"
          value={form.socio_nivel_estres}
          onChange={(e) =>
            handleChange('socio_nivel_estres', e.target.value)
          }
        />
      </label>

      {/* ACTITUDES */}
      <h4 style={{ gridColumn: '1 / -1' }}>Actitudes</h4>

      <label>
        Motivación
        <textarea
          rows={2}
          value={form.act_motivacion}
          onChange={(e) =>
            handleChange('act_motivacion', e.target.value)
          }
        />
      </label>

      <label>
        Barreras percibidas
        <textarea
          rows={2}
          value={form.act_barreras}
          onChange={(e) =>
            handleChange('act_barreras', e.target.value)
          }
        />
      </label>

      <label>
        Alternativas
        <textarea
          rows={2}
          value={form.act_alternativas}
          onChange={(e) =>
            handleChange('act_alternativas', e.target.value)
          }
        />
      </label>

      <label>
        Grado de importancia al cambio (1–10)
        <input
          type="text"
          value={form.act_importancia_cambio}
          onChange={(e) =>
            handleChange(
              'act_importancia_cambio',
              e.target.value
            )
          }
        />
      </label>

      {/* AMBIENTE DE ALIMENTACIÓN */}
      <h4 style={{ gridColumn: '1 / -1' }}>
        Ambiente de alimentación y comidas
      </h4>

      <label>
        Influencia del estado de ánimo en alimentación
        <textarea
          rows={2}
          value={form.amb_influencia_estado_animo}
          onChange={(e) =>
            handleChange(
              'amb_influencia_estado_animo',
              e.target.value
            )
          }
        />
      </label>

      <label>
        Duración de las comidas
        <input
          type="text"
          value={form.amb_duracion_comidas}
          onChange={(e) =>
            handleChange('amb_duracion_comidas', e.target.value)
          }
        />
      </label>

      <label>
        No. de comidas por día
        <input
          type="text"
          value={form.amb_num_comidas_dia}
          onChange={(e) =>
            handleChange('amb_num_comidas_dia', e.target.value)
          }
        />
      </label>

      <label>
        No. de comidas en casa
        <input
          type="text"
          value={form.amb_num_comidas_casa}
          onChange={(e) =>
            handleChange('amb_num_comidas_casa', e.target.value)
          }
        />
      </label>

      <label style={{ gridColumn: '1 / -1' }}>
        No. de comidas fuera de casa y qué alimentos consume
        <textarea
          rows={2}
          value={form.amb_alimentos_fuera_casa}
          onChange={(e) =>
            handleChange(
              'amb_alimentos_fuera_casa',
              e.target.value
            )
          }
        />
      </label>

      {/* SNACKS / ALERGIAS / PREFERENCIAS */}
      <h4 style={{ gridColumn: '1 / -1' }}>
        Entre comidas, alergias y preferencias
      </h4>

      <label>
        ¿Come entre comidas?
        <input
          type="text"
          value={form.snacks_come_entre_comidas}
          onChange={(e) =>
            handleChange(
              'snacks_come_entre_comidas',
              e.target.value
            )
          }
        />
      </label>

      <label>
        ¿Qué y cuándo?
        <textarea
          rows={2}
          value={form.snacks_que_y_cuando}
          onChange={(e) =>
            handleChange('snacks_que_y_cuando', e.target.value)
          }
        />
      </label>

      <label>
        Alergias alimentarias
        <textarea
          rows={2}
          value={form.alergias_alimentarias}
          onChange={(e) =>
            handleChange(
              'alergias_alimentarias',
              e.target.value
            )
          }
        />
      </label>

      <label>
        Intolerancias alimentarias
        <textarea
          rows={2}
          value={form.intolerancias_alimentarias}
          onChange={(e) =>
            handleChange(
              'intolerancias_alimentarias',
              e.target.value
            )
          }
        />
      </label>

      <label>
        Alimentos preferidos
        <textarea
          rows={2}
          value={form.alimentos_preferidos}
          onChange={(e) =>
            handleChange(
              'alimentos_preferidos',
              e.target.value
            )
          }
        />
      </label>

      <label>
        Aversiones alimentarias
        <textarea
          rows={2}
          value={form.aversiones_alimentarias}
          onChange={(e) =>
            handleChange(
              'aversiones_alimentarias',
              e.target.value
            )
          }
        />
      </label>

      <label>
        Consumo de agua
        <input
          type="text"
          value={form.consumo_agua}
          onChange={(e) =>
            handleChange('consumo_agua', e.target.value)
          }
        />
      </label>

      {/* CUESTIONARIO DE FRECUENCIA DE ALIMENTOS */}
      <h4 style={{ gridColumn: '1 / -1' }}>
        Cuestionario de frecuencia de consumo de alimentos
      </h4>

      <p style={{ gridColumn: '1 / -1', fontSize: '0.85rem', color: '#9ca3af' }}>
        Puedes anotar, por ejemplo: "3 veces al día", "1 vez por semana", "casi nunca", etc.
      </p>

      <label>
        Frutas
        <input
          type="text"
          value={form.frecuencia_frutas}
          onChange={(e) =>
            handleChange('frecuencia_frutas', e.target.value)
          }
          placeholder="Ej. 2 porciones/día"
        />
      </label>

      <label>
        Verduras
        <input
          type="text"
          value={form.frecuencia_verduras}
          onChange={(e) =>
            handleChange('frecuencia_verduras', e.target.value)
          }
          placeholder="Ej. 1 vez en comida y cena"
        />
      </label>

      <label>
        Cereales
        <input
          type="text"
          value={form.frecuencia_cereales}
          onChange={(e) =>
            handleChange('frecuencia_cereales', e.target.value)
          }
          placeholder="Ej. pan, tortilla, arroz..."
        />
      </label>

      <label>
        Leguminosas
        <input
          type="text"
          value={form.frecuencia_leguminosas}
          onChange={(e) =>
            handleChange('frecuencia_leguminosas', e.target.value)
          }
          placeholder="Ej. frijol, lenteja, garbanzo..."
        />
      </label>

      <label>
        Lácteos
        <input
          type="text"
          value={form.frecuencia_lacteos}
          onChange={(e) =>
            handleChange('frecuencia_lacteos', e.target.value)
          }
          placeholder="Leche, yogurt, queso..."
        />
      </label>

      <label>
        Alimentos de origen animal (general)
        <input
          type="text"
          value={form.frecuencia_aoa}
          onChange={(e) =>
            handleChange('frecuencia_aoa', e.target.value)
          }
          placeholder="Huevos, pollo, res, pescado..."
        />
      </label>

      <label>
        Carnes rojas
        <input
          type="text"
          value={form.frecuencia_carnes_rojas}
          onChange={(e) =>
            handleChange('frecuencia_carnes_rojas', e.target.value)
          }
          placeholder="Carne de res, cerdo..."
        />
      </label>

      <label>
        Carnes blancas
        <input
          type="text"
          value={form.frecuencia_carnes_blancas}
          onChange={(e) =>
            handleChange('frecuencia_carnes_blancas', e.target.value)
          }
          placeholder="Pollo, pescado..."
        />
      </label>

      <label>
        Grasas
        <input
          type="text"
          value={form.frecuencia_grasas}
          onChange={(e) =>
            handleChange('frecuencia_grasas', e.target.value)
          }
          placeholder="Aceites, mantequilla, aderezos..."
        />
      </label>

      <label>
        Azúcares
        <input
          type="text"
          value={form.frecuencia_azucares}
          onChange={(e) =>
            handleChange('frecuencia_azucares', e.target.value)
          }
          placeholder="Dulces, postres, pan dulce..."
        />
      </label>

      <label>
        Sustitutos de azúcar
        <input
          type="text"
          value={form.frecuencia_sustitutos_azucar}
          onChange={(e) =>
            handleChange('frecuencia_sustitutos_azucar', e.target.value)
          }
          placeholder="Stevia, sucralosa, etc."
        />
      </label>

      <label>
        Refrescos o bebidas endulzadas
        <input
          type="text"
          value={form.frecuencia_refrescos}
          onChange={(e) =>
            handleChange('frecuencia_refrescos', e.target.value)
          }
          placeholder="Ej. 1 lata/día, solo fines de semana..."
        />
      </label>

      <label>
        Alimentos ultraprocesados
        <input
          type="text"
          value={form.frecuencia_ultraprocesados}
          onChange={(e) =>
            handleChange('frecuencia_ultraprocesados', e.target.value)
          }
          placeholder="Galletas, papas, comida rápida..."
        />
      </label>

      <label style={{ gridColumn: '1 / -1' }}>
        Resumen global de frecuencia de alimentos (opcional)
        <textarea
          rows={3}
          value={form.frecuencia_alimentos}
          onChange={(e) =>
            handleChange('frecuencia_alimentos', e.target.value)
          }
          placeholder="Comentarios generales sobre el patrón de consumo."
        />
      </label>

      {/* SUSTANCIAS */}
      <h4 style={{ gridColumn: '1 / -1' }}>
        Frecuencia de consumo de sustancias
      </h4>

      <label>
        Alcohol
        <input
          type="text"
          value={form.sustancias_alcohol}
          onChange={(e) =>
            handleChange('sustancias_alcohol', e.target.value)
          }
        />
      </label>

      <label>
        Cafeína
        <input
          type="text"
          value={form.sustancias_cafeina}
          onChange={(e) =>
            handleChange('sustancias_cafeina', e.target.value)
          }
        />
      </label>

      <label>
        Tabaco
        <input
          type="text"
          value={form.sustancias_tabaco}
          onChange={(e) =>
            handleChange('sustancias_tabaco', e.target.value)
          }
        />
      </label>

      <label>
        Drogas
        <input
          type="text"
          value={form.sustancias_drogas}
          onChange={(e) =>
            handleChange('sustancias_drogas', e.target.value)
          }
        />
      </label>

      {/* ACTIVIDAD FÍSICA */}
      <h4 style={{ gridColumn: '1 / -1' }}>
        Actividad y función física
      </h4>

      <label>
        ¿Realiza actividad física?
        <input
          type="text"
          value={form.af_realiza_actividad}
          onChange={(e) =>
            handleChange(
              'af_realiza_actividad',
              e.target.value
            )
          }
        />
      </label>

      <label>
        Tipo
        <input
          type="text"
          value={form.af_tipo}
          onChange={(e) =>
            handleChange('af_tipo', e.target.value)
          }
        />
      </label>

      <label>
        Duración
        <input
          type="text"
          value={form.af_duracion}
          onChange={(e) =>
            handleChange('af_duracion', e.target.value)
          }
        />
      </label>

      <label>
        Frecuencia semanal
        <input
          type="text"
          value={form.af_frecuencia_semanal}
          onChange={(e) =>
            handleChange(
              'af_frecuencia_semanal',
              e.target.value
            )
          }
        />
      </label>

      <label>
        Tiempo realizado
        <input
          type="text"
          value={form.af_tiempo_realizado}
          onChange={(e) =>
            handleChange(
              'af_tiempo_realizado',
              e.target.value
            )
          }
        />
      </label>

      <label style={{ gridColumn: '1 / -1' }}>
        ¿Con qué finalidad realizas ejercicio físico?
        <textarea
          rows={2}
          value={form.af_objetivo}
          onChange={(e) =>
            handleChange('af_objetivo', e.target.value)
          }
        />
      </label>

      {/* HÁBITOS GENERALES */}
      <h4 style={{ gridColumn: '1 / -1' }}>Hábitos</h4>

      <label>
        Horas sentado al día
        <input
          type="text"
          value={form.hab_horas_sentado}
          onChange={(e) =>
            handleChange(
              'hab_horas_sentado',
              e.target.value
            )
          }
        />
      </label>

      <label>
        Horas de sueño
        <input
          type="text"
          value={form.hab_horas_duerme}
          onChange={(e) =>
            handleChange('hab_horas_duerme', e.target.value)
          }
        />
      </label>

      <label>
        Horas de TV
        <input
          type="text"
          value={form.hab_horas_tv}
          onChange={(e) =>
            handleChange('hab_horas_tv', e.target.value)
          }
        />
      </label>

      <label>
        Horas de computadora/celular
        <input
          type="text"
          value={form.hab_horas_computadora}
          onChange={(e) =>
            handleChange(
              'hab_horas_computadora',
              e.target.value
            )
          }
        />
      </label>

      {/* ACTIVIDADES DIARIAS */}
      <h4 style={{ gridColumn: '1 / -1' }}>
        Actividades diarias
      </h4>

      <label style={{ gridColumn: '1 / -1' }}>
        Día habitual
        <textarea
          rows={3}
          value={form.actividades_dia_habitual}
          onChange={(e) =>
            handleChange(
              'actividades_dia_habitual',
              e.target.value
            )
          }
        />
      </label>

      <label style={{ gridColumn: '1 / -1' }}>
        Fin de semana
        <textarea
          rows={3}
          value={form.actividades_fin_semana}
          onChange={(e) =>
            handleChange(
              'actividades_fin_semana',
              e.target.value
            )
          }
        />
      </label>

      {/* DIAGNÓSTICO */}
      <h4 style={{ gridColumn: '1 / -1' }}>
        Diagnóstico nutricional
      </h4>

      <label style={{ gridColumn: '1 / -1' }}>
        Diagnóstico nutricional
        <textarea
          rows={4}
          value={form.diagnostico_nutricional}
          onChange={(e) =>
            handleChange(
              'diagnostico_nutricional',
              e.target.value
            )
          }
        />
      </label>

      <button type="submit" disabled={saving}>
        {saving ? 'Guardando...' : 'Guardar historia clínica'}
      </button>

      {msg && (
        <p className={msg.startsWith('Error') ? 'error' : 'info'}>
          {msg}
        </p>
      )}
    </form>
  );
}
