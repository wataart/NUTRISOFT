// src/components/ClinicalHistoryTab.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const EMPTY_FORM = {
  motivo_consulta: '',

  // Antecedentes personales
  padecimiento_actual: '',
  otras_enfermedades: '',
  hospitalizaciones: '',
  cirugias: '',

  // Farmacológico y suplementos
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

  // Valoración antropométrica
  peso_maximo: '',
  peso_maximo_edad: '',
  peso_minimo: '',
  peso_minimo_edad: '',
  peso_que_le_agrada: '',
  peso_habitual: '',
  antropometria_detalle: '',

  // Indicadores nutricionales
  indicadores_nutricionales: '',

  // Valoración bioquímica
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

  // Cuestionario de frecuencia de alimentos
  frecuencia_alimentos: '',

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
      } else if (data) {
        setRecordId(data.id);
        const contenido = data.contenido || {};
        setForm({ ...EMPTY_FORM, ...contenido });
      }

      setLoading(false);
    };

    fetchHistory();
  }, [patientId]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setMsg('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    const payload = {
      id: recordId || undefined,
      patient_id: patientId,
      contenido: form,
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

      <label>
        Fármacos o suplementos
        <textarea
          rows={2}
          value={form.farmacos_suplementos}
          onChange={(e) =>
            handleChange('farmacos_suplementos', e.target.value)
          }
        />
      </label>

      <label>
        Dosis y frecuencia
        <textarea
          rows={2}
          value={form.farmacos_dosis_frecuencia}
          onChange={(e) =>
            handleChange('farmacos_dosis_frecuencia', e.target.value)
          }
        />
      </label>

      <label>
        Tiempo de uso
        <textarea
          rows={2}
          value={form.farmacos_tiempo_uso}
          onChange={(e) =>
            handleChange('farmacos_tiempo_uso', e.target.value)
          }
        />
      </label>

      <label>
        Motivo de uso
        <textarea
          rows={2}
          value={form.farmacos_motivo_uso}
          onChange={(e) =>
            handleChange('farmacos_motivo_uso', e.target.value)
          }
        />
      </label>

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

      <label style={{ gridColumn: '1 / -1' }}>
        Detalle de mediciones antropométricas
        <textarea
          rows={4}
          placeholder="Peso, estatura, IMC, circunferencias, pliegues, etc."
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

      <label style={{ gridColumn: '1 / -1' }}>
        Resumen (complexión, IMC, % grasa, etc.)
        <textarea
          rows={4}
          value={form.indicadores_nutricionales}
          onChange={(e) =>
            handleChange(
              'indicadores_nutricionales',
              e.target.value
            )
          }
        />
      </label>

      {/* VALORACIÓN BIOQUÍMICA */}
      <h4 style={{ gridColumn: '1 / -1' }}>
        Valoración bioquímica
      </h4>

      <label style={{ gridColumn: '1 / -1' }}>
        Parámetros, fechas, resultados, interpretación
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

      {/* FRECUENCIA DE ALIMENTOS */}
      <h4 style={{ gridColumn: '1 / -1' }}>
        Cuestionario de frecuencia de consumo de alimentos
      </h4>

      <label style={{ gridColumn: '1 / -1' }}>
        Resumen por grupo de alimento
        <textarea
          rows={4}
          value={form.frecuencia_alimentos}
          onChange={(e) =>
            handleChange(
              'frecuencia_alimentos',
              e.target.value
            )
          }
          placeholder="Frutas, verduras, cereales, leguminosas, lácteos, carnes, grasas, azúcares, etc."
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
