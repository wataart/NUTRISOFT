// src/components/ClinicalHistoryTab.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const EMPTY_FORM = {
  motivo_consulta: '',

  // Antecedentes personales
  padecimiento_actual: '',
  otras_enfermedades: '',
  hospitalizaciones: '',
  cirugias: '',

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

  // Valoración antropométrica (mediciones)
  med_peso_kg: '',
  med_talla_m: '',
  med_cintura_cm: '',
  med_cadera_cm: '',
  med_abdominal_cm: '',

  // Indicadores nutricionales
  ind_complexion: '',
  ind_grasa_kg: '',
  ind_masa_muscular_kg: '',

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
  gi_gastritis: '',
  gi_ulcera: '',
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

  // Cuestionario de frecuencia de alimentos (por grupos)
  frecuencia_alimentos: '', // resumen general (opcional)
  freq_frutas: '',
  freq_verduras: '',
  freq_cereales: '',
  freq_leguminosas: '',
  freq_lacteos: '',
  freq_aoa: '',
  freq_carnes_rojas: '',
  freq_carnes_blancas: '',
  freq_grasas: '',
  freq_azucares: '',
  freq_sustitutos_azucar: '',
  freq_refrescos: '',
  freq_ultraprocesados: '',

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

  // Hábitos
  hab_horas_sentado: '',
  hab_horas_duerme: '',
  hab_horas_tv: '',
  hab_horas_computadora: '',

  // Actividades diarias
  actividades_dia_habitual: '',
  actividades_fin_semana: '',

  // Diagnóstico
  diagnostico_nutricional: '',
};

const EMPTY_FARMACO = {
  id: 1,
  nombre: '',
  dosis: '',
  frecuencia: '',
  tiempo_uso: '',
  motivo_uso: '',
  interaccion: '',
};

const EMPTY_LAB = {
  id: 1,
  parametro: '',
  resultado: '',
  unidades: '',
  fecha: '',
  interpretacion: '',
};

export default function ClinicalHistoryTab({ patientId }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [farmacos, setFarmacos] = useState([]);
  const [labs, setLabs] = useState([]);
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfMsg, setPdfMsg] = useState('');

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
        if (error.code !== 'PGRST116') {
          console.error(error);
        }
        setRecordId(null);
        setForm(EMPTY_FORM);
        setFarmacos([]);
        setLabs([]);
      } else if (data) {
        setRecordId(data.id);
        const contenido = data.contenido || {};
        const rawForm = contenido.form ? contenido.form : contenido;

        setForm({ ...EMPTY_FORM, ...rawForm });
        setFarmacos(contenido.farmacos || rawForm.farmacos || []);
        setLabs(contenido.labs || rawForm.labs || []);
      }

      setLoading(false);
    };

    fetchHistory();
  }, [patientId]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setMsg('');
  };

  // ------- FARMACOS (tabla dinámica) -------
  const addFarmaco = () => {
    setFarmacos((prev) => {
      const nextId = prev.length ? prev[prev.length - 1].id + 1 : 1;
      return [...prev, { ...EMPTY_FARMACO, id: nextId }];
    });
  };

  const removeFarmaco = (id) => {
    setFarmacos((prev) => prev.filter((f) => f.id !== id));
  };

  const handleFarmacoChange = (id, field, value) => {
    setFarmacos((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  // ------- LABS (valoración bioquímica, tabla dinámica) -------
  const addLab = () => {
    setLabs((prev) => {
      const nextId = prev.length ? prev[prev.length - 1].id + 1 : 1;
      return [...prev, { ...EMPTY_LAB, id: nextId }];
    });
  };

  const removeLab = (id) => {
    setLabs((prev) => prev.filter((l) => l.id !== id));
  };

  const handleLabChange = (id, field, value) => {
    setLabs((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  // ------- Cálculos antropométricos (IMC, %grasa, %MM, ICC) -------
  const antropoDerived = useMemo(() => {
    const peso = parseFloat(form.med_peso_kg) || 0;
    const talla = parseFloat(form.med_talla_m) || 0;
    const cintura = parseFloat(form.med_cintura_cm) || 0;
    const cadera = parseFloat(form.med_cadera_cm) || 0;
    const grasaKg = parseFloat(form.ind_grasa_kg) || 0;
    const mmKg = parseFloat(form.ind_masa_muscular_kg) || 0;

    const imc = peso > 0 && talla > 0 ? peso / (talla * talla) : 0;
    const pctGrasa = peso > 0 && grasaKg > 0 ? (grasaKg * 100) / peso : 0;
    const pctMM = peso > 0 && mmKg > 0 ? (mmKg * 100) / peso : 0;
    const icc = cintura > 0 && cadera > 0 ? cintura / cadera : 0;

    return { imc, pctGrasa, pctMM, icc };
  }, [
    form.med_peso_kg,
    form.med_talla_m,
    form.med_cintura_cm,
    form.med_cadera_cm,
    form.ind_grasa_kg,
    form.ind_masa_muscular_kg,
  ]);

  const { imc, pctGrasa, pctMM, icc } = antropoDerived;

  // ------- PDF: leer como texto y prellenar -------
  const readPdfAsText = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const strings = content.items.map((item) => item.str);
      fullText += strings.join(' ') + '\n';
    }

    return fullText;
  };

  // Extrae un bloque entre dos títulos/secciones (case-insensitive)
  const extractSection = (text, startLabel, endLabel) => {
    const lower = text.toLowerCase();
    const startIdx = lower.indexOf(startLabel.toLowerCase());
    if (startIdx === -1) return '';

    const from = startIdx + startLabel.length;
    let slice = text.substring(from);

    if (endLabel) {
      const lowerSlice = slice.toLowerCase();
      const endIdx = lowerSlice.indexOf(endLabel.toLowerCase());
      if (endIdx !== -1) {
        slice = slice.substring(0, endIdx);
      }
    }

    return slice.trim();
  };

  // Extrae texto ENTRE una etiqueta y la siguiente, aunque todo venga en la misma línea
  const extractBetween = (text, label, nextLabels = []) => {
    const idx = text.indexOf(label);
    if (idx === -1) return '';
    const start = idx + label.length;
    const slice = text.substring(start);
    let end = slice.length;

    nextLabels.forEach((nl) => {
      if (!nl) return;
      const pos = slice.indexOf(nl);
      if (pos !== -1 && pos < end) {
        end = pos;
      }
    });

    return slice.substring(0, end).trim().replace(/\s+/g, ' ');
  };

  const prefillFromPdfText = (text) => {
    setForm((prev) => {
      const next = { ...prev };

      const ext = extractBetween;

      // Motivo de consulta
      next.motivo_consulta =
        ext(text, 'Motivo de consulta', [
          'Antecedentes patológicos personales',
        ]) || next.motivo_consulta;

      // Antecedentes patológicos personales
      next.padecimiento_actual =
        ext(text, 'Padecimiento actual:', ['Otras enfermedades:']) ||
        next.padecimiento_actual;

      next.otras_enfermedades =
        ext(text, 'Otras enfermedades:', ['Hospitalizaciones:']) ||
        next.otras_enfermedades;

      next.hospitalizaciones =
        ext(text, 'Hospitalizaciones:', ['Cirugías:']) ||
        next.hospitalizaciones;

      next.cirugias =
        ext(text, 'Cirugías:', [
          'Tratamiento farmacológico y uso de suplementos',
        ]) || next.cirugias;

      // Presión arterial (arreglado para que no se coma todo lo que sigue)
      next.presion_habitual =
        ext(text, 'Presión arterial habitual:', [
          'Toma de presión en consulta:',
        ]) || next.presion_habitual;

      next.presion_en_consulta =
        ext(text, 'Toma de presión en consulta:', [
          'Antecedentes patológico-familiares',
        ]) || next.presion_en_consulta;

// Antecedentes patológico-familiares como bloque
// Cortamos hasta "Valoración antropométrica" (nombre real de la sección)
// y si no aparece, probamos con "Mediciones antropométricas" como respaldo.
let antFamBlock =
  extractSection(
    text,
    'Antecedentes patológico-familiares',
    'Valoración antropométrica'
  ) ||
  extractSection(
    text,
    'Antecedentes patológico-familiares',
    'Mediciones antropométricas'
  );

if (antFamBlock) {
  next.antecedentes_familiares =
    antFamBlock.trim() || next.antecedentes_familiares;
}


      // Aspectos socioeconómicos (evitar que un campo arrastre a los demás)
      next.socio_ingreso_mensual =
        ext(text, 'Ingreso mensual:', ['% usado en alimentos:']) ||
        next.socio_ingreso_mensual;

      next.socio_porcentaje_alimentos =
        ext(text, '% usado en alimentos:', [
          'No. de personas en el hogar:',
        ]) || next.socio_porcentaje_alimentos;

      next.socio_num_personas_hogar =
        ext(text, 'No. de personas en el hogar:', ['Seguro médico:']) ||
        next.socio_num_personas_hogar;

      next.socio_seguro_medico =
        ext(text, 'Seguro médico:', ['Religión:']) ||
        next.socio_seguro_medico;

      next.socio_religion =
        ext(text, 'Religión:', ['Nivel de estrés diario (1-10):']) ||
        next.socio_religion;

      next.socio_nivel_estres =
        ext(text, 'Nivel de estrés diario (1-10):', ['Actitudes']) ||
        next.socio_nivel_estres;

      // Actitudes
      next.act_motivacion =
        ext(text, 'Motivación:', ['Barreras percibidas:']) ||
        next.act_motivacion;

      next.act_barreras =
        ext(text, 'Barreras percibidas:', ['Alternativas:']) ||
        next.act_barreras;

      next.act_alternativas =
        ext(text, 'Alternativas:', [
          'Grado de importancia al cambio (1-10):',
        ]) || next.act_alternativas;

      next.act_importancia_cambio =
        ext(
          text,
          'Grado de importancia al cambio (1-10):',
          ['Ambiente de alimentación y comidas']
        ) || next.act_importancia_cambio;

      // Ambiente de alimentación y comidas
      next.amb_influencia_estado_animo =
        ext(
          text,
          'Influencia del estado de ánimo en alimentación:',
          ['Duración de las comidas:']
        ) || next.amb_influencia_estado_animo;

      next.amb_duracion_comidas =
        ext(text, 'Duración de las comidas:', [
          'No. de comidas por día:',
        ]) || next.amb_duracion_comidas;

      next.amb_num_comidas_dia =
        ext(text, 'No. de comidas por día:', [
          'No. de comidas en casa:',
        ]) || next.amb_num_comidas_dia;

      next.amb_num_comidas_casa =
        ext(text, 'No. de comidas en casa:', [
          'No. de comidas fuera de casa:',
        ]) || next.amb_num_comidas_casa;

      next.amb_num_comidas_fuera =
        ext(text, 'No. de comidas fuera de casa:', [
          'Alimentos que consume fuera de casa:',
        ]) || next.amb_num_comidas_fuera;

      next.amb_alimentos_fuera_casa =
        ext(text, 'Alimentos que consume fuera de casa:', [
          'Entre comidas, alergias y preferencias',
        ]) || next.amb_alimentos_fuera_casa;

      // Entre comidas, alergias y preferencias
      next.snacks_come_entre_comidas =
        ext(text, '¿Come entre comidas?', ['¿Qué y cuándo?']) ||
        next.snacks_come_entre_comidas;

      next.snacks_que_y_cuando =
        ext(text, '¿Qué y cuándo?', ['Alergias alimentarias:']) ||
        next.snacks_que_y_cuando;

      next.alergias_alimentarias =
        ext(text, 'Alergias alimentarias:', [
          'Intolerancias alimentarias:',
        ]) || next.alergias_alimentarias;

      next.intolerancias_alimentarias =
        ext(text, 'Intolerancias alimentarias:', [
          'Alimentos preferidos:',
        ]) || next.intolerancias_alimentarias;

      next.alimentos_preferidos =
        ext(text, 'Alimentos preferidos:', [
          'Aversiones alimentarias:',
        ]) || next.alimentos_preferidos;

      next.aversiones_alimentarias =
        ext(text, 'Aversiones alimentarias:', ['CONSUMO DE AGUA:']) ||
        next.aversiones_alimentarias;

      next.consumo_agua =
        ext(text, 'CONSUMO DE AGUA:', [
          'Cuestionario de frecuencia de consumo de alimentos',
        ]) || next.consumo_agua;

      // Cuestionario de frecuencia (resumen general)
      const frecBlock = extractSection(
        text,
        'Cuestionario de frecuencia de consumo de alimentos',
        'Frecuencia de consumo de sustancias'
      );
      if (frecBlock) {
        next.frecuencia_alimentos =
          frecBlock.trim() || next.frecuencia_alimentos;
      }

      // Sustancias
      next.sustancias_alcohol =
        ext(text, 'Alcohol:', ['Cafeína:']) ||
        next.sustancias_alcohol;

      next.sustancias_cafeina =
        ext(text, 'Cafeína:', ['Tabaco:']) ||
        next.sustancias_cafeina;

      next.sustancias_tabaco =
        ext(text, 'Tabaco:', ['Drogas:']) ||
        next.sustancias_tabaco;

      next.sustancias_drogas =
        ext(text, 'Drogas:', ['Actividad y función física']) ||
        next.sustancias_drogas;

      // Actividad y función física (arreglado)
      next.af_realiza_actividad =
        ext(text, '¿Realiza actividad física?', ['Tipo:']) ||
        next.af_realiza_actividad;

      next.af_tipo = ext(text, 'Tipo:', ['Duración:']) || next.af_tipo;

      next.af_duracion =
        ext(text, 'Duración:', ['Frecuencia semanal:']) ||
        next.af_duracion;

      next.af_frecuencia_semanal =
        ext(text, 'Frecuencia semanal:', ['Tiempo realizado']) ||
        next.af_frecuencia_semanal;

      next.af_tiempo_realizado =
        ext(text, 'Tiempo realizado', [
          '¿Con qué finalidad realizas ejercicio físico?',
        ]) || next.af_tiempo_realizado;

      next.af_objetivo =
        ext(
          text,
          '¿Con qué finalidad realizas ejercicio físico?',
          ['Hábitos']
        ) || next.af_objetivo;

      // Hábitos
      next.hab_horas_sentado =
        ext(
          text,
          '¿Cuántas horas pasas sentado al día?',
          ['¿Cuántas horas duermes?']
        ) || next.hab_horas_sentado;

      next.hab_horas_duerme =
        ext(text, '¿Cuántas horas duermes?', [
          '¿Cuántas horas ves televisión?',
        ]) || next.hab_horas_duerme;

      next.hab_horas_tv =
        ext(
          text,
          '¿Cuántas horas ves televisión?',
          ['¿Cuántas horas usas la computadora/celular?']
        ) || next.hab_horas_tv;

      next.hab_horas_computadora =
        ext(
          text,
          '¿Cuántas horas usas la computadora/celular?',
          ['Día habitual']
        ) || next.hab_horas_computadora;

      // Actividades diarias
      next.actividades_dia_habitual =
        ext(text, 'Día habitual', ['Fin de semana']) ||
        next.actividades_dia_habitual;

      next.actividades_fin_semana =
        ext(text, 'Fin de semana', ['Diagnóstico nutricional']) ||
        next.actividades_fin_semana;

      // Diagnóstico nutricional (bloque final)
      const diagBlock = extractSection(
        text,
        'Diagnóstico nutricional',
        ''
      );
      if (diagBlock) {
        next.diagnostico_nutricional =
          diagBlock.trim() || next.diagnostico_nutricional;
      }

      return next;
    });
  };

  const handlePdfUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPdfLoading(true);
    setPdfMsg('');

    try {
      const text = await readPdfAsText(file);
      prefillFromPdfText(text);
      setPdfMsg(
        'Expediente leído. Revisa los campos y luego guarda la historia clínica.'
      );
    } catch (err) {
      console.error(err);
      setPdfMsg('No se pudo leer el PDF. Revisa el archivo.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    const contenido = {
      form,
      farmacos,
      labs,
    };

    const payload = {
      id: recordId || undefined,
      patient_id: patientId,
      contenido,
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
      <h3 style={{ gridColumn: '1 / -1' }}>Historia clínica</h3>

      {/* CARGA DE EXPEDIENTE PDF */}
      <div
        style={{
          gridColumn: '1 / -1',
          marginBottom: 12,
          padding: 10,
          borderRadius: 10,
          border: '1px solid #374151',
          background: '#020617',
        }}
      >
        <label style={{ display: 'block', fontSize: '0.9rem' }}>
          Cargar historia clínica en PDF:
          <input
            type="file"
            accept="application/pdf"
            onChange={handlePdfUpload}
            style={{ display: 'block', marginTop: 6 }}
          />
        </label>
        {pdfLoading && (
          <p className="info" style={{ marginTop: 6 }}>
            Leyendo archivo PDF...
          </p>
        )}
        {pdfMsg && (
          <p className="info" style={{ marginTop: 6 }}>
            {pdfMsg}
          </p>
        )}
        <small style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
          Se rellenarán automáticamente varios campos (motivo, antecedentes,
          consumo de agua, cuestionario de frecuencia, sustancias, hábitos,
          etc.). Revisa y edita lo necesario antes de guardar.
        </small>
      </div>

      {/* MOTIVO DE CONSULTA */}
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

      {/* FARMACOS Y SUPLEMENTOS (tabla) */}
      <h4 style={{ gridColumn: '1 / -1' }}>
        Tratamiento farmacológico y suplementos
      </h4>

      <div style={{ gridColumn: '1 / -1' }}>
        <table className="menu-items-table">
          <thead>
            <tr>
              <th>Fármaco / suplemento</th>
              <th>Dosis</th>
              <th>Frecuencia</th>
              <th>Tiempo de uso</th>
              <th>Motivo de uso</th>
              <th>Interacción fármaco-nutriente</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {farmacos.length === 0 && (
              <tr>
                <td colSpan={7}>Sin fármacos registrados.</td>
              </tr>
            )}
            {farmacos.map((f) => (
              <tr key={f.id}>
                <td>
                  <input
                    type="text"
                    value={f.nombre}
                    onChange={(e) =>
                      handleFarmacoChange(
                        f.id,
                        'nombre',
                        e.target.value
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={f.dosis}
                    onChange={(e) =>
                      handleFarmacoChange(
                        f.id,
                        'dosis',
                        e.target.value
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={f.frecuencia}
                    onChange={(e) =>
                      handleFarmacoChange(
                        f.id,
                        'frecuencia',
                        e.target.value
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={f.tiempo_uso}
                    onChange={(e) =>
                      handleFarmacoChange(
                        f.id,
                        'tiempo_uso',
                        e.target.value
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={f.motivo_uso}
                    onChange={(e) =>
                      handleFarmacoChange(
                        f.id,
                        'motivo_uso',
                        e.target.value
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={f.interaccion}
                    onChange={(e) =>
                      handleFarmacoChange(
                        f.id,
                        'interaccion',
                        e.target.value
                      )
                    }
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
      </div>

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
        Detalle (sobrepeso/obesidad, DM, HTA, etc.)
        <textarea
          rows={4}
          value={form.antecedentes_familiares}
          onChange={(e) =>
            handleChange(
              'antecedentes_familiares',
              e.target.value
            )
          }
        />
      </label>

      {/* VALORACIÓN ANTROPOMÉTRICA */}
      <h4 style={{ gridColumn: '1 / -1' }}>
        Mediciones antropométricas
      </h4>

      <label>
        Peso (kg)
        <input
          type="number"
          step="0.1"
          value={form.med_peso_kg}
          onChange={(e) =>
            handleChange('med_peso_kg', e.target.value)
          }
        />
      </label>

      <label>
        Talla (m)
        <input
          type="number"
          step="0.01"
          value={form.med_talla_m}
          onChange={(e) =>
            handleChange('med_talla_m', e.target.value)
          }
        />
      </label>

      <label>
        Circunferencia cintura (cm)
        <input
          type="number"
          step="0.1"
          value={form.med_cintura_cm}
          onChange={(e) =>
            handleChange('med_cintura_cm', e.target.value)
          }
        />
      </label>

      <label>
        Circunferencia cadera (cm)
        <input
          type="number"
          step="0.1"
          value={form.med_cadera_cm}
          onChange={(e) =>
            handleChange('med_cadera_cm', e.target.value)
          }
        />
      </label>

      <label>
        Circunferencia abdominal (cm)
        <input
          type="number"
          step="0.1"
          value={form.med_abdominal_cm}
          onChange={(e) =>
            handleChange('med_abdominal_cm', e.target.value)
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
        Grasa corporal (kg)
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
        % grasa corporal total
        <input
          type="number"
          step="0.1"
          value={pctGrasa ? pctGrasa.toFixed(1) : ''}
          readOnly
        />
      </label>

      <label>
        Masa muscular (kg)
        <input
          type="number"
          step="0.1"
          value={form.ind_masa_muscular_kg}
          onChange={(e) =>
            handleChange(
              'ind_masa_muscular_kg',
              e.target.value
            )
          }
        />
      </label>

      <label>
        % masa muscular total
        <input
          type="number"
          step="0.1"
          value={pctMM ? pctMM.toFixed(1) : ''}
          readOnly
        />
      </label>

      <label>
        Índice cintura/cadera
        <input
          type="number"
          step="0.01"
          value={icc ? icc.toFixed(2) : ''}
          readOnly
        />
      </label>

      {/* VALORACIÓN BIOQUÍMICA */}
      <h4 style={{ gridColumn: '1 / -1' }}>
        Valoración bioquímica
      </h4>

      <div style={{ gridColumn: '1 / -1' }}>
        <table className="menu-items-table">
          <thead>
            <tr>
              <th>Parámetro</th>
              <th>Resultado</th>
              <th>Unidades</th>
              <th>Fecha</th>
              <th>Interpretación</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {labs.length === 0 && (
              <tr>
                <td colSpan={6}>Sin parámetros registrados.</td>
              </tr>
            )}
            {labs.map((l) => (
              <tr key={l.id}>
                <td>
                  <input
                    type="text"
                    value={l.parametro}
                    onChange={(e) =>
                      handleLabChange(
                        l.id,
                        'parametro',
                        e.target.value
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={l.resultado}
                    onChange={(e) =>
                      handleLabChange(
                        l.id,
                        'resultado',
                        e.target.value
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={l.unidades}
                    onChange={(e) =>
                      handleLabChange(
                        l.id,
                        'unidades',
                        e.target.value
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    type="date"
                    value={l.fecha}
                    onChange={(e) =>
                      handleLabChange(
                        l.id,
                        'fecha',
                        e.target.value
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={l.interpretacion}
                    onChange={(e) =>
                      handleLabChange(
                        l.id,
                        'interpretacion',
                        e.target.value
                      )
                    }
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => removeLab(l.id)}
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
          onClick={addLab}
        >
          + Agregar parámetro
        </button>
      </div>

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
            handleChange(
              'gi_dolor_abdominal',
              e.target.value
            )
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
        Colitis
        <input
          type="text"
          value={form.gi_colitis}
          onChange={(e) =>
            handleChange('gi_colitis', e.target.value)
          }
        />
      </label>

      <label>
        Gastritis
        <input
          type="text"
          value={form.gi_gastritis}
          onChange={(e) =>
            handleChange('gi_gastritis', e.target.value)
          }
        />
      </label>

      <label>
        Úlcera
        <input
          type="text"
          value={form.gi_ulcera}
          onChange={(e) =>
            handleChange('gi_ulcera', e.target.value)
          }
        />
      </label>

      <label style={{ gridColumn: '1 / -1' }}>
        Otros problemas gastrointestinales
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
            handleChange(
              'socio_ingreso_mensual',
              e.target.value
            )
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
            handleChange(
              'socio_seguro_medico',
              e.target.value
            )
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
            handleChange(
              'amb_duracion_comidas',
              e.target.value
            )
          }
        />
      </label>

      <label>
        No. de comidas por día
        <input
          type="text"
          value={form.amb_num_comidas_dia}
          onChange={(e) =>
            handleChange(
              'amb_num_comidas_dia',
              e.target.value
            )
          }
        />
      </label>

      <label>
        No. de comidas en casa
        <input
          type="text"
          value={form.amb_num_comidas_casa}
          onChange={(e) =>
            handleChange(
              'amb_num_comidas_casa',
              e.target.value
            )
          }
        />
      </label>

      <label>
        No. de comidas fuera de casa
        <input
          type="text"
          value={form.amb_num_comidas_fuera}
          onChange={(e) =>
            handleChange(
              'amb_num_comidas_fuera',
              e.target.value
            )
          }
        />
      </label>

      <label style={{ gridColumn: '1 / -1' }}>
        Alimentos que consume fuera de casa
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
            handleChange(
              'snacks_que_y_cuando',
              e.target.value
            )
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

      {/* FRECUENCIA DE ALIMENTOS POR GRUPOS */}
      <h4 style={{ gridColumn: '1 / -1' }}>
        Cuestionario de frecuencia de consumo de alimentos
      </h4>

      <label style={{ gridColumn: '1 / -1' }}>
        Resumen general (opcional)
        <textarea
          rows={3}
          value={form.frecuencia_alimentos}
          onChange={(e) =>
            handleChange(
              'frecuencia_alimentos',
              e.target.value
            )
          }
        />
      </label>

      <label>
        Frutas
        <input
          type="text"
          value={form.freq_frutas}
          onChange={(e) =>
            handleChange('freq_frutas', e.target.value)
          }
          placeholder="Ej. diario, 2 porciones"
        />
      </label>

      <label>
        Verduras
        <input
          type="text"
          value={form.freq_verduras}
          onChange={(e) =>
            handleChange('freq_verduras', e.target.value)
          }
        />
      </label>

      <label>
        Cereales
        <input
          type="text"
          value={form.freq_cereales}
          onChange={(e) =>
            handleChange('freq_cereales', e.target.value)
          }
        />
      </label>

      <label>
        Leguminosas
        <input
          type="text"
          value={form.freq_leguminosas}
          onChange={(e) =>
            handleChange('freq_leguminosas', e.target.value)
          }
        />
      </label>

      <label>
        Lácteos
        <input
          type="text"
          value={form.freq_lacteos}
          onChange={(e) =>
            handleChange('freq_lacteos', e.target.value)
          }
        />
      </label>

      <label>
        Alimentos de origen animal
        <input
          type="text"
          value={form.freq_aoa}
          onChange={(e) =>
            handleChange('freq_aoa', e.target.value)
          }
        />
      </label>

      <label>
        Carnes rojas
        <input
          type="text"
          value={form.freq_carnes_rojas}
          onChange={(e) =>
            handleChange(
              'freq_carnes_rojas',
              e.target.value
            )
          }
        />
      </label>

      <label>
        Carnes blancas
        <input
          type="text"
          value={form.freq_carnes_blancas}
          onChange={(e) =>
            handleChange(
              'freq_carnes_blancas',
              e.target.value
            )
          }
        />
      </label>

      <label>
        Grasas
        <input
          type="text"
          value={form.freq_grasas}
          onChange={(e) =>
            handleChange('freq_grasas', e.target.value)
          }
        />
      </label>

      <label>
        Azúcares
        <input
          type="text"
          value={form.freq_azucares}
          onChange={(e) =>
            handleChange('freq_azucares', e.target.value)
          }
        />
      </label>

      <label>
        Sustitutos de azúcar
        <input
          type="text"
          value={form.freq_sustitutos_azucar}
          onChange={(e) =>
            handleChange(
              'freq_sustitutos_azucar',
              e.target.value
            )
          }
        />
      </label>

      <label>
        Refrescos o bebidas endulzadas
        <input
          type="text"
          value={form.freq_refrescos}
          onChange={(e) =>
            handleChange('freq_refrescos', e.target.value)
          }
        />
      </label>

      <label>
        Alimentos ultraprocesados
        <input
          type="text"
          value={form.freq_ultraprocesados}
          onChange={(e) =>
            handleChange(
              'freq_ultraprocesados',
              e.target.value
            )
          }
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
            handleChange(
              'sustancias_alcohol',
              e.target.value
            )
          }
        />
      </label>

      <label>
        Cafeína
        <input
          type="text"
          value={form.sustancias_cafeina}
          onChange={(e) =>
            handleChange(
              'sustancias_cafeina',
              e.target.value
            )
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
