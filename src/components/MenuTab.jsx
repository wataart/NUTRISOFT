// src/components/MenuTab.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function MenuTab({ patientId }) {
  const [menus, setMenus] = useState([]);
  const [selectedMenuId, setSelectedMenuId] = useState(null);
  const [items, setItems] = useState([]);

  const [menuForm, setMenuForm] = useState({
    fecha: '',
    nombre: '',
    calorias_totales: '',
    proteinas_totales_g: '',
    grasas_totales_g: '',
    carbohidratos_totales_g: '',
    agua_ml: '',
  });

  const [itemForm, setItemForm] = useState({
    tiempo: '',
    alimento: '',
    equivalente: '',
    cantidad: '1',
    unidad: '',
  });

  const [searchAlimento, setSearchAlimento] = useState('');
  const [foodResults, setFoodResults] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);

  const [loading, setLoading] = useState(true);
  const [savingMenu, setSavingMenu] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [msg, setMsg] = useState('');

  // fecha por defecto
  useEffect(() => {
    const today = new Date().toISOString().substring(0, 10);
    setMenuForm((f) => ({ ...f, fecha: today }));
  }, []);

  // Cargar menús del paciente
  useEffect(() => {
    const fetchMenus = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('menus')
        .select('*')
        .eq('patient_id', patientId)
        .order('fecha', { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setMenus(data || []);
        if (data && data.length > 0) {
          setSelectedMenuId(data[0].id);
        }
      }
      setLoading(false);
    };

    fetchMenus();
  }, [patientId]);

  // Cargar items cuando cambia el menú seleccionado
  useEffect(() => {
    const fetchItems = async () => {
      if (!selectedMenuId) {
        setItems([]);
        return;
      }

      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('menu_id', selectedMenuId)
        .order('id', { ascending: true });

      if (error) {
        console.error(error);
      } else {
        setItems(data || []);
      }
    };

    fetchItems();
  }, [selectedMenuId]);

  const handleMenuFormChange = (e) => {
    const { name, value } = e.target;
    setMenuForm((prev) => ({ ...prev, [name]: value }));
    setMsg('');
  };

  const handleItemFormChange = (e) => {
    const { name, value } = e.target;
    setItemForm((prev) => ({ ...prev, [name]: value }));
    setMsg('');
  };

  // Buscar alimentos en Supabase cuando el usuario escribe
  useEffect(() => {
    const fetchFoods = async () => {
      const q = searchAlimento.trim();
      if (!q) {
        setFoodResults([]);
        setSelectedFood(null);
        return;
      }

      // búsqueda simple por nombre (case-insensitive con ilike)
      const { data, error } = await supabase
        .from('alimentos')
        .select('*')
        .ilike('nombre', `%${q}%`)
        .limit(30);

      if (error) {
        console.error(error);
        setFoodResults([]);
      } else {
        setFoodResults(data || []);
      }
    };

    fetchFoods();
  }, [searchAlimento]);

  const handleSelectFood = (food) => {
    setSelectedFood(food);
    setSearchAlimento(food.nombre);
    setFoodResults([]);

    setItemForm((prev) => ({
      ...prev,
      alimento: food.nombre,
      equivalente: `${food.cantidad_sugerida || ''} ${food.unidad || ''}`.trim(),
      unidad: food.unidad || '',
      cantidad: prev.cantidad || '1',
    }));
  };

  // cálculo macros del alimento seleccionado * cantidad
  const selectedFoodMacros = useMemo(() => {
    if (!selectedFood) return null;
    const cantidadNum = parseFloat(itemForm.cantidad) || 1;

    const kcal = (Number(selectedFood.energia_kcal) || 0) * cantidadNum;
    const prot = (Number(selectedFood.proteina_g) || 0) * cantidadNum;
    const fat = (Number(selectedFood.lipidos_g) || 0) * cantidadNum;
    const carb =
      (Number(selectedFood.carbohidratos_g) || 0) * cantidadNum;

    return {
      calorias: kcal,
      proteinas_g: prot,
      grasas_g: fat,
      carbohidratos_g: carb,
    };
  }, [selectedFood, itemForm.cantidad]);

  const handleCreateMenu = async (e) => {
    e.preventDefault();
    setSavingMenu(true);
    setMsg('');

    const payload = {
      patient_id: patientId,
      fecha: menuForm.fecha,
      nombre: menuForm.nombre,
      calorias_totales: menuForm.calorias_totales
        ? parseFloat(menuForm.calorias_totales)
        : null,
      proteinas_totales_g: menuForm.proteinas_totales_g
        ? parseFloat(menuForm.proteinas_totales_g)
        : null,
      grasas_totales_g: menuForm.grasas_totales_g
        ? parseFloat(menuForm.grasas_totales_g)
        : null,
      carbohidratos_totales_g:
        menuForm.carbohidratos_totales_g
          ? parseFloat(menuForm.carbohidratos_totales_g)
          : null,
      agua_ml: menuForm.agua_ml
        ? parseFloat(menuForm.agua_ml)
        : null,
    };

    const { data, error } = await supabase
      .from('menus')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error(error);
      setMsg('Error al crear menú');
      setSavingMenu(false);
      return;
    }

    setMenus((prev) => [data, ...prev]);
    setSelectedMenuId(data.id);
    setMsg('Menú creado');
    setSavingMenu(false);
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!selectedMenuId) {
      alert('Primero crea un menú o selecciona uno.');
      return;
    }
    if (!selectedFood) {
      alert('Selecciona un alimento de la lista.');
      return;
    }

    setSavingItem(true);
    setMsg('');

    const macros = selectedFoodMacros || {
      calorias: null,
      proteinas_g: null,
      grasas_g: null,
      carbohidratos_g: null,
    };

    const payload = {
      menu_id: selectedMenuId,
      tiempo: itemForm.tiempo,
      alimento: selectedFood.nombre,
      equivalente: itemForm.equivalente,
      cantidad: itemForm.cantidad
        ? parseFloat(itemForm.cantidad)
        : 1,
      unidad: itemForm.unidad || selectedFood.unidad,
      calorias: macros.calorias,
      proteinas_g: macros.proteinas_g,
      grasas_g: macros.grasas_g,
      carbohidratos_g: macros.carbohidratos_g,
    };

    const { data, error } = await supabase
      .from('menu_items')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error(error);
      setMsg('Error al agregar alimento');
      setSavingItem(false);
      return;
    }

    setItems((prev) => [...prev, data]);
    setMsg('Alimento agregado');
    setSavingItem(false);
  };

  if (loading) return <div>Cargando menús...</div>;

  return (
    <div className="menu-tab">
      <h3>Menús / Plan de alimentación</h3>

      {/* SELECCIÓN DE MENÚ EXISTENTE */}
      <div>
        <label>
          Menú:
          <select
            value={selectedMenuId || ''}
            onChange={(e) =>
              setSelectedMenuId(
                e.target.value ? Number(e.target.value) : null
              )
            }
          >
            {menus.length === 0 && (
              <option value="">Sin menús</option>
            )}
            {menus.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fecha} - {m.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* TABLA DE ALIMENTOS DEL MENÚ */}
      <table className="menu-items-table">
        <thead>
          <tr>
            <th>Tiempo</th>
            <th>Alimento</th>
            <th>Equivalente</th>
            <th>Cant.</th>
            <th>Unidad</th>
            <th>Kcal</th>
            <th>Prot (g)</th>
            <th>Grasas (g)</th>
            <th>CHO (g)</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={9}>Sin alimentos aún.</td>
            </tr>
          )}
          {items.map((it) => (
            <tr key={it.id}>
              <td>{it.tiempo}</td>
              <td>{it.alimento}</td>
              <td>{it.equivalente}</td>
              <td>{it.cantidad}</td>
              <td>{it.unidad}</td>
              <td>{it.calorias ?? '-'}</td>
              <td>{it.proteinas_g ?? '-'}</td>
              <td>{it.grasas_g ?? '-'}</td>
              <td>{it.carbohidratos_g ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* FORMULARIO PARA CREAR NUEVO MENÚ */}
      <form className="menu-form" onSubmit={handleCreateMenu}>
        <h4>Crear nuevo menú</h4>

        <label>
          Fecha:
          <input
            type="date"
            name="fecha"
            value={menuForm.fecha}
            onChange={handleMenuFormChange}
            required
          />
        </label>

        <label>
          Nombre del menú:
          <input
            type="text"
            name="nombre"
            value={menuForm.nombre}
            onChange={handleMenuFormChange}
            required
          />
        </label>

        <label>
          Calorías totales (opcional):
          <input
            type="number"
            name="calorias_totales"
            value={menuForm.calorias_totales}
            onChange={handleMenuFormChange}
          />
        </label>

        <label>
          Proteínas totales (g):
          <input
            type="number"
            name="proteinas_totales_g"
            value={menuForm.proteinas_totales_g}
            onChange={handleMenuFormChange}
          />
        </label>

        <label>
          Grasas totales (g):
          <input
            type="number"
            name="grasas_totales_g"
            value={menuForm.grasas_totales_g}
            onChange={handleMenuFormChange}
          />
        </label>

        <label>
          CHO totales (g):
          <input
            type="number"
            name="carbohidratos_totales_g"
            value={menuForm.carbohidratos_totales_g}
            onChange={handleMenuFormChange}
          />
        </label>

        <label>
          Agua (mL/día):
          <input
            type="number"
            name="agua_ml"
            value={menuForm.agua_ml}
            onChange={handleMenuFormChange}
          />
        </label>

        <button type="submit" disabled={savingMenu}>
          {savingMenu ? 'Creando...' : 'Crear menú'}
        </button>
      </form>

      {/* FORMULARIO PARA AGREGAR ALIMENTO (AUTOCOMPLETE DESDE SUPABASE) */}
      <form className="menu-item-form" onSubmit={handleAddItem}>
        <h4>Agregar alimento al menú (desde tabla alimentos)</h4>

        <label>
          Tiempo de comida:
          <select
            name="tiempo"
            value={itemForm.tiempo}
            onChange={handleItemFormChange}
          >
            <option value="">Seleccionar...</option>
            <option value="Desayuno">Desayuno</option>
            <option value="Colación 1">Colación 1</option>
            <option value="Comida">Comida</option>
            <option value="Colación 2">Colación 2</option>
            <option value="Cena">Cena</option>
          </select>
        </label>

        <label>
          Buscar alimento:
          <input
            type="text"
            value={searchAlimento}
            onChange={(e) => {
              setSearchAlimento(e.target.value);
              setSelectedFood(null);
            }}
            placeholder="Escribe parte del nombre..."
          />
        </label>

        {/* Lista de sugerencias */}
        {searchAlimento && (
          <div
            style={{
              gridColumn: '1 / -1',
              maxHeight: 160,
              overflowY: 'auto',
              borderRadius: 8,
              border: '1px solid #374151',
              background: '#020617',
              padding: 6,
              marginTop: -8,
              marginBottom: 8,
            }}
          >
            {foodResults.length === 0 && (
              <div
                style={{
                  fontSize: '0.85rem',
                  color: '#9ca3af',
                  padding: '4px 6px',
                }}
              >
                Sin resultados.
              </div>
            )}
            {foodResults.map((food) => (
              <div
                key={food.id}
                style={{
                  padding: '4px 6px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
                onClick={() => handleSelectFood(food)}
              >
                <strong>{food.nombre}</strong>{' '}
                <span style={{ color: '#9ca3af' }}>
                  ({food.grupo} – {food.cantidad_sugerida}{' '}
                  {food.unidad})
                </span>
              </div>
            ))}
          </div>
        )}

        <label>
          Equivalente (auto desde el libro, editable):
          <input
            type="text"
            name="equivalente"
            value={itemForm.equivalente}
            onChange={handleItemFormChange}
          />
        </label>

        <label>
          Cantidad de porciones:
          <input
            type="number"
            step="0.25"
            name="cantidad"
            value={itemForm.cantidad}
            onChange={handleItemFormChange}
          />
        </label>

        {/* Resumen de macros del alimento seleccionado */}
        {selectedFood && selectedFoodMacros && (
          <div
            style={{
              gridColumn: '1 / -1',
              marginTop: 8,
              padding: 8,
              borderRadius: 8,
              border: '1px solid #374151',
              background: '#020617',
              fontSize: '0.85rem',
            }}
          >
            <strong>
              {selectedFood.nombre} – {itemForm.cantidad} porción(es)
            </strong>
            <p style={{ margin: '4px 0' }}>
              {Number(selectedFood.energia_kcal) || 0} kcal por porción →{' '}
              {selectedFoodMacros.calorias.toFixed(1)} kcal totales
            </p>
            <p style={{ margin: '4px 0' }}>
              Prot: {Number(selectedFood.proteina_g) || 0} g por porción →{' '}
              {selectedFoodMacros.proteinas_g.toFixed(1)} g
              <br />
              Grasas: {Number(selectedFood.lipidos_g) || 0} g por porción →{' '}
              {selectedFoodMacros.grasas_g.toFixed(1)} g
              <br />
              CHO: {Number(selectedFood.carbohidratos_g) || 0} g por porción →{' '}
              {selectedFoodMacros.carbohidratos_g.toFixed(1)} g
            </p>
          </div>
        )}

        <button type="submit" disabled={savingItem}>
          {savingItem ? 'Agregando...' : 'Agregar alimento'}
        </button>
      </form>

      {msg && <p className="info">{msg}</p>}
    </div>
  );
}
