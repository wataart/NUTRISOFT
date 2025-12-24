// src/components/Recall24hTab.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Recall24hTab({ patientId }) {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({
    fecha: '',
    descripcion_alimentos: '',
    notas: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // peso actual del paciente (para cálculos por kg)
  const [pesoActualKg, setPesoActualKg] = useState('');

  // items = lista de "alimentos/platillos" con macros
  const [items, setItems] = useState([
    {
      id: 1,
      platillo: '',
      alimento: '',
      cantidad: '',
      unidad: '',
      calorias: '',
      proteinas_g: '',
      grasas_g: '',
      carbohidratos_g: '',
      // macros base por porción según SMAE (no se muestran, sólo para cálculo)
      base_calorias: '',
      base_proteinas_g: '',
      base_grasas_g: '',
      base_carbohidratos_g: '',
    },
  ]);

  // --- ESTADO PARA AUTOCOMPLETAR ALIMENTO DESDE SUPABASE ---
  const [activeItemId, setActiveItemId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [foodResults, setFoodResults] = useState([]);

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

  const handleChangeForm = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setMsg('');
  };

  const handleChangeItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        // si se cambia la cantidad y tenemos macros base, recalculamos
        if (field === 'cantidad') {
          const cantidadNum = parseFloat(value) || 0;

          // si no hay base, sólo actualizamos la cantidad
          if (
            item.base_calorias === '' &&
            item.base_proteinas_g === '' &&
            item.base_grasas_g === '' &&
            item.base_carbohidratos_g === ''
          ) {
            return { ...item, cantidad: value };
          }

          return {
            ...item,
            cantidad: value,
            calorias:
              cantidadNum > 0
                ? (parseFloat(item.base_calorias) || 0) *
                  cantidadNum
                : '',
            proteinas_g:
              cantidadNum > 0
                ? (parseFloat(item.base_proteinas_g) || 0) *
                  cantidadNum
                : '',
            grasas_g:
              cantidadNum > 0
                ? (parseFloat(item.base_grasas_g) || 0) *
                  cantidadNum
                : '',
            carbohidratos_g:
              cantidadNum > 0
                ? (parseFloat(item.base_carbohidratos_g) || 0) *
                  cantidadNum
                : '',
          };
        }

        return { ...item, [field]: value };
      })
    );
    setMsg('');
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: prev.length ? prev[prev.length - 1].id + 1 : 1,
        platillo: '',
        alimento: '',
        cantidad: '',
        unidad: '',
        calorias: '',
        proteinas_g: '',
        grasas_g: '',
        carbohidratos_g: '',
        base_calorias: '',
        base_proteinas_g: '',
        base_grasas_g: '',
        base_carbohidratos_g: '',
      },
    ]);
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // ---------- AUTOCOMPLETADO CON TABLA "alimentos" DE SUPABASE ----------

  useEffect(() => {
    const q = searchTerm.trim();
    if (!q) {
      setFoodResults([]);
      return;
    }

    const fetchFoods = async () => {
      const { data, error } = await supabase
        .from('alimentos')
        .select(
          'id, nombre, grupo, cantidad_sugerida, unidad, energia_kcal, proteina_g, lipidos_g, carbohidratos_g'
        )
        .ilike('nombre', `%${q}%`)
        .limit(30);

      if (error) {
        console.error('Error buscando alimentos:', error);
        setFoodResults([]);
      } else {
        setFoodResults(data || []);
      }
    };

    fetchFoods();
  }, [searchTerm]);

  const handleSelectFood = (itemId, food) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        const cantidadActual =
          parseFloat(item.cantidad) || 1; // por defecto 1 porción
        const baseCal = Number(food.energia_kcal) || 0;
        const baseProt = Number(food.proteina_g) || 0;
        const baseGrasa = Number(food.lipidos_g) || 0;
        const baseCarb = Number(food.carbohidratos_g) || 0;

        return {
          ...item,
          alimento: food.nombre,
          // si no había cantidad, la dejamos en 1
          cantidad:
            item.cantidad === '' ? '1' : item.cantidad,
          unidad: item.unidad || food.unidad || '',
          base_calorias: baseCal,
          base_proteinas_g: baseProt,
          base_grasas_g: baseGrasa,
          base_carbohidratos_g: baseCarb,
          // macros calculadas según nº de porciones
          calorias: baseCal * cantidadActual || '',
          proteinas_g: baseProt * cantidadActual || '',
          grasas_g: baseGrasa * cantidadActual || '',
          carbohidratos_g: baseCarb * cantidadActual || '',
        };
      })
    );

    setActiveItemId(null);
    setSearchTerm('');
    setFoodResults([]);
  };

  // ----------------------------------------------------------------------

  // Totales del día a partir de todos los alimentos
  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const kcal = parseFloat(item.calorias) || 0;
        const p = parseFloat(item.proteinas_g) || 0;
        const g = parseFloat(item.grasas_g) || 0;
        const c = parseFloat(item.carbohidratos_g) || 0;

        acc.calorias += kcal;
        acc.proteinas_g += p;
        acc.grasas_g += g;
        acc.carbohidratos_g += c;

        return acc;
      },
      {
        calorias: 0,
        proteinas_g: 0,
        grasas_g: 0,
        carbohidratos_g: 0,
      }
    );
  }, [items]);

  // Cálculos por kg y % de macros
  const macrosInfo = useMemo(() => {
    const peso = parseFloat(pesoActualKg) || 0;
    const { calorias, proteinas_g, grasas_g, carbohidratos_g } = totals;

    const kcalProt = proteinas_g * 4;
    const kcalGrasas = grasas_g * 9;
    const kcalCarb = carbohidratos_g * 4;

    const totalKcal = calorias || kcalProt + kcalGrasas + kcalCarb;

    const pctProt =
      totalKcal > 0 ? (kcalProt * 100) / totalKcal : 0;
    const pctGrasas =
      totalKcal > 0 ? (kcalGrasas * 100) / totalKcal : 0;
    const pctCarb =
      totalKcal > 0 ? (kcalCarb * 100) / totalKcal : 0;

    const kcalPorKg = peso > 0 ? totalKcal / peso : 0;
    const protPorKg = peso > 0 ? proteinas_g / peso : 0;
    const grasasPorKg = peso > 0 ? grasas_g / peso : 0;
    const carbPorKg = peso > 0 ? carbohidratos_g / peso : 0;

    return {
      totalKcal,
      kcalProt,
      kcalGrasas,
      kcalCarb,
      pctProt,
      pctGrasas,
      pctCarb,
      kcalPorKg,
      protPorKg,
      grasasPorKg,
      carbPorKg,
    };
  }, [pesoActualKg, totals]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    const {
      totalKcal,
      proteinas_g,
      grasas_g,
      carbohidratos_g,
    } = {
      totalKcal: totals.calorias,
      proteinas_g: totals.proteinas_g,
      grasas_g: totals.grasas_g,
      carbohidratos_g: totals.carbohidratos_g,
    };

    const payload = {
      patient_id: patientId,
      fecha: form.fecha,
      // guardamos el "detalle" como JSON en descripcion_alimentos
      descripcion_alimentos: JSON.stringify(items),
      calorias: totalKcal || null,
      proteinas_g: proteinas_g || null,
      grasas_g: grasas_g || null,
      carbohidratos_g: carbohidratos_g || null,
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
      setSaving(false);
      return;
    }

    setRecords((prev) => [data, ...prev]);
    setMsg('Recuento de 24 horas guardado');
    setSaving(false);
  };

  if (loading) return <div>Cargando recuentos...</div>;

  const {
    totalKcal,
    kcalProt,
    kcalGrasas,
    kcalCarb,
    pctProt,
    pctGrasas,
    pctCarb,
    kcalPorKg,
    protPorKg,
    grasasPorKg,
    carbPorKg,
  } = macrosInfo;

  return (
    <div className="recall-tab">
      <h3>Recuento de 24 horas</h3>

      <form className="recall-form" onSubmit={handleSave}>
        <label>
          Fecha:
          <input
            type="date"
            name="fecha"
            value={form.fecha}
            onChange={handleChangeForm}
            required
          />
        </label>

        <label>
          Peso actual del paciente (kg):
          <input
            type="number"
            step="0.1"
            value={pesoActualKg}
            onChange={(e) => setPesoActualKg(e.target.value)}
          />
        </label>

        <label>
          Notas generales (opcional):
          <textarea
            name="notas"
            rows={2}
            value={form.notas}
            onChange={handleChangeForm}
          />
        </label>

        {/* TABLA DE ALIMENTOS / PLATILLOS */}
        <div style={{ gridColumn: '1 / -1', marginTop: 12 }}>
          <p style={{ fontSize: '0.9rem', color: '#9ca3af' }}>
            Agrega cada alimento o platillo con su cantidad y macros
            estimados (a partir de SMAE u otra referencia).
          </p>

          <table className="menu-items-table">
            <thead>
              <tr>
                <th>Platillo</th>
                <th>Alimento</th>
                <th>Cant.</th>
                <th>Unidad</th>
                <th>Kcal</th>
                <th>Prot (g)</th>
                <th>Grasas (g)</th>
                <th>Carboh. (g)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <input
                      type="text"
                      value={item.platillo}
                      onChange={(e) =>
                        handleChangeItem(
                          item.id,
                          'platillo',
                          e.target.value
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={item.alimento}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleChangeItem(
                          item.id,
                          'alimento',
                          value
                        );
                        setActiveItemId(item.id);
                        setSearchTerm(value);
                      }}
                      onFocus={() => {
                        setActiveItemId(item.id);
                        setSearchTerm(item.alimento || '');
                      }}
                      placeholder="Escribe parte del alimento."
                    />
                    {/* SUGERENCIAS DE ALIMENTOS */}
                    {activeItemId === item.id && searchTerm && (
                      <div
                        style={{
                          position: 'relative',
                          zIndex: 5,
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            top: 2,
                            left: 0,
                            right: 0,
                            maxHeight: 160,
                            overflowY: 'auto',
                            borderRadius: 8,
                            border: '1px solid #374151',
                            background: '#020617',
                            padding: 6,
                          }}
                        >
                          {foodResults.length === 0 && (
                            <div
                              style={{
                                fontSize: '0.8rem',
                                color: '#9ca3af',
                                padding: '4px 6px',
                              }}
                            >
                              Sin resultados en la tabla de
                              alimentos.
                            </div>
                          )}
                          {foodResults.map((food) => (
                            <div
                              key={food.id}
                              style={{
                                padding: '4px 6px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                              }}
                              onMouseDown={(e) => {
                                e.preventDefault(); // evita blur prematuro
                                handleSelectFood(item.id, food);
                              }}
                            >
                              <strong>{food.nombre}</strong>{' '}
                              <span
                                style={{ color: '#9ca3af' }}
                              >
                                ({food.grupo} –{' '}
                                {food.cantidad_sugerida}{' '}
                                {food.unidad})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.1"
                      value={item.cantidad}
                      onChange={(e) =>
                        handleChangeItem(
                          item.id,
                          'cantidad',
                          e.target.value
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={item.unidad}
                      onChange={(e) =>
                        handleChangeItem(
                          item.id,
                          'unidad',
                          e.target.value
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="1"
                      value={item.calorias}
                      onChange={(e) =>
                        handleChangeItem(
                          item.id,
                          'calorias',
                          e.target.value
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.1"
                      value={item.proteinas_g}
                      onChange={(e) =>
                        handleChangeItem(
                          item.id,
                          'proteinas_g',
                          e.target.value
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.1"
                      value={item.grasas_g}
                      onChange={(e) =>
                        handleChangeItem(
                          item.id,
                          'grasas_g',
                          e.target.value
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.1"
                      value={item.carbohidratos_g}
                      onChange={(e) =>
                        handleChangeItem(
                          item.id,
                          'carbohidratos_g',
                          e.target.value
                        )
                      }
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => removeItem(item.id)}
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
            onClick={addItem}
          >
            + Agregar alimento
          </button>
        </div>

        {/* RESUMEN DE TOTALES Y CÁLCULOS */}
        <div
          style={{
            gridColumn: '1 / -1',
            marginTop: 14,
            padding: 12,
            borderRadius: 12,
            border: '1px solid #374151',
            background: '#020617',
            fontSize: '0.85rem',
          }}
        >
          <h4 style={{ marginTop: 0 }}>Resumen del día</h4>
          <p>
            <strong>Calorías totales:</strong>{' '}
            {totalKcal.toFixed(1)} kcal
          </p>
          <p>
            <strong>Proteínas:</strong>{' '}
            {totals.proteinas_g.toFixed(1)} g (
            {kcalProt.toFixed(1)} kcal,{' '}
            {pctProt.toFixed(1)}%)
            <br />
            <strong>Grasas:</strong>{' '}
            {totals.grasas_g.toFixed(1)} g (
            {kcalGrasas.toFixed(1)} kcal,{' '}
            {pctGrasas.toFixed(1)}%)
            <br />
            <strong>Carbohidratos:</strong>{' '}
            {totals.carbohidratos_g.toFixed(1)} g (
            {kcalCarb.toFixed(1)} kcal,{' '}
            {pctCarb.toFixed(1)}%)
          </p>

          {pesoActualKg && parseFloat(pesoActualKg) > 0 && (
            <>
              <p>
                <strong>Por kg de peso actual:</strong>
              </p>
              <ul>
                <li>
                  Calorías por kg:{' '}
                  {kcalPorKg.toFixed(2)} kcal/kg
                </li>
                <li>
                  Proteínas:{' '}
                  {protPorKg.toFixed(2)} g/kg
                </li>
                <li>
                  Grasas:{' '}
                  {grasasPorKg.toFixed(2)} g/kg
                </li>
                <li>
                  Carbohidratos:{' '}
                  {carbPorKg.toFixed(2)} g/kg
                </li>
              </ul>
            </>
          )}
        </div>

        <button type="submit" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar recuento'}
        </button>
        {msg && <p className="info">{msg}</p>}
      </form>

      <h3>Historial de recuentos</h3>
      {records.length === 0 && <p>Sin recuentos aún.</p>}

      <ul className="recall-list">
        {records.map((r) => (
          <li key={r.id} className="recall-item">
            <strong>{r.fecha}</strong> –{' '}
            {r.calorias ?? '-'} kcal
            <br />
            <small>
              {r.descripcion_alimentos
                ? 'Detalle guardado (JSON)'
                : ''}
            </small>
          </li>
        ))}
      </ul>
    </div>
  );
}
