// src/components/MenuTab.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function MenuTab({ patientId }) {
  const [menus, setMenus] = useState([]);
  const [selectedMenuId, setSelectedMenuId] = useState(null);
  const [menuItems, setMenuItems] = useState([]);

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
    cantidad: '',
    unidad: '',
    calorias: '',
    proteinas_g: '',
    grasas_g: '',
    carbohidratos_g: '',
  });

  const [loadingMenus, setLoadingMenus] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [savingMenu, setSavingMenu] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const today = new Date().toISOString().substring(0, 10);
    setMenuForm((f) => ({ ...f, fecha: today }));
  }, []);

  useEffect(() => {
    const fetchMenus = async () => {
      setLoadingMenus(true);
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
      setLoadingMenus(false);
    };

    fetchMenus();
  }, [patientId]);

  useEffect(() => {
    const fetchItems = async () => {
      if (!selectedMenuId) {
        setMenuItems([]);
        return;
      }
      setLoadingItems(true);
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('menu_id', selectedMenuId);

      if (error) {
        console.error(error);
      } else {
        setMenuItems(data || []);
      }
      setLoadingItems(false);
    };

    fetchItems();
  }, [selectedMenuId]);

  const handleMenuChange = (e) => {
    const { name, value } = e.target;
    setMenuForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setItemForm((prev) => ({ ...prev, [name]: value }));
  };

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
      carbohidratos_totales_g: menuForm.carbohidratos_totales_g
        ? parseFloat(menuForm.carbohidratos_totales_g)
        : null,
      agua_ml: menuForm.agua_ml ? parseFloat(menuForm.agua_ml) : null,
    };

    const { data, error } = await supabase
      .from('menus')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error(error);
      setMsg('Error al crear menú');
    } else {
      setMenus((prev) => [data, ...prev]);
      setSelectedMenuId(data.id);
      setMsg('Menú creado');
    }
    setSavingMenu(false);
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!selectedMenuId) {
      setMsg('Primero crea o selecciona un menú');
      return;
    }
    setSavingItem(true);
    setMsg('');

    const payload = {
      menu_id: selectedMenuId,
      tiempo: itemForm.tiempo,
      alimento: itemForm.alimento,
      equivalente: itemForm.equivalente,
      cantidad: itemForm.cantidad ? parseFloat(itemForm.cantidad) : null,
      unidad: itemForm.unidad,
      calorias: itemForm.calorias ? parseFloat(itemForm.calorias) : null,
      proteinas_g: itemForm.proteinas_g
        ? parseFloat(itemForm.proteinas_g)
        : null,
      grasas_g: itemForm.grasas_g ? parseFloat(itemForm.grasas_g) : null,
      carbohidratos_g: itemForm.carbohidratos_g
        ? parseFloat(itemForm.carbohidratos_g)
        : null,
    };

    const { data, error } = await supabase
      .from('menu_items')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error(error);
      setMsg('Error al agregar alimento');
    } else {
      setMenuItems((prev) => [...prev, data]);
      setMsg('Alimento agregado');
    }
    setSavingItem(false);
  };

  return (
    <div className="menu-tab">
      <h3>Menús del paciente</h3>

      {loadingMenus ? (
        <div>Cargando menús...</div>
      ) : (
        <>
          {menus.length > 0 ? (
            <select
              value={selectedMenuId || ''}
              onChange={(e) => setSelectedMenuId(Number(e.target.value))}
            >
              {menus.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fecha} - {m.nombre}
                </option>
              ))}
            </select>
          ) : (
            <p>No hay menús todavía.</p>
          )}
        </>
      )}

      <form className="menu-form" onSubmit={handleCreateMenu}>
        <h4>Crear nuevo menú</h4>

        <label>
          Fecha:
          <input
            type="date"
            name="fecha"
            value={menuForm.fecha}
            onChange={handleMenuChange}
            required
          />
        </label>

        <label>
          Nombre del menú:
          <input
            type="text"
            name="nombre"
            value={menuForm.nombre}
            onChange={handleMenuChange}
            placeholder="Ej. Plan semanal 1"
          />
        </label>

        <label>
          Calorías totales:
          <input
            type="number"
            name="calorias_totales"
            value={menuForm.calorias_totales}
            onChange={handleMenuChange}
          />
        </label>

        <label>
          Proteínas totales (g):
          <input
            type="number"
            name="proteinas_totales_g"
            value={menuForm.proteinas_totales_g}
            onChange={handleMenuChange}
          />
        </label>

        <label>
          Grasas totales (g):
          <input
            type="number"
            name="grasas_totales_g"
            value={menuForm.grasas_totales_g}
            onChange={handleMenuChange}
          />
        </label>

        <label>
          Carbohidratos totales (g):
          <input
            type="number"
            name="carbohidratos_totales_g"
            value={menuForm.carbohidratos_totales_g}
            onChange={handleMenuChange}
          />
        </label>

        <label>
          Agua (ml/día):
          <input
            type="number"
            name="agua_ml"
            value={menuForm.agua_ml}
            onChange={handleMenuChange}
          />
        </label>

        <button type="submit" disabled={savingMenu}>
          {savingMenu ? 'Guardando menú...' : 'Crear menú'}
        </button>
      </form>

      <hr />

      <h3>Alimentos del menú seleccionado</h3>
      {loadingItems ? (
        <div>Cargando alimentos...</div>
      ) : selectedMenuId ? (
        <>
          {menuItems.length === 0 && <p>Sin alimentos aún.</p>}

          <table className="menu-items-table">
            <thead>
              <tr>
                <th>Tiempo</th>
                <th>Alimento</th>
                <th>Equivalente</th>
                <th>Cant.</th>
                <th>Unidad</th>
                <th>Calorías</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.tiempo}</td>
                  <td>{item.alimento}</td>
                  <td>{item.equivalente}</td>
                  <td>{item.cantidad ?? '-'}</td>
                  <td>{item.unidad}</td>
                  <td>{item.calorias ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p>Selecciona o crea un menú.</p>
      )}

      <form className="menu-item-form" onSubmit={handleAddItem}>
        <h4>Agregar alimento al menú</h4>

        <label>
          Tiempo (desayuno, comida, etc.):
          <input
            type="text"
            name="tiempo"
            value={itemForm.tiempo}
            onChange={handleItemChange}
          />
        </label>

        <label>
          Alimento:
          <input
            type="text"
            name="alimento"
            value={itemForm.alimento}
            onChange={handleItemChange}
          />
        </label>

        <label>
          Equivalente:
          <input
            type="text"
            name="equivalente"
            value={itemForm.equivalente}
            onChange={handleItemChange}
          />
        </label>

        <label>
          Cantidad:
          <input
            type="number"
            step="0.1"
            name="cantidad"
            value={itemForm.cantidad}
            onChange={handleItemChange}
          />
        </label>

        <label>
          Unidad:
          <input
            type="text"
            name="unidad"
            value={itemForm.unidad}
            onChange={handleItemChange}
          />
        </label>

        <label>
          Calorías:
          <input
            type="number"
            name="calorias"
            value={itemForm.calorias}
            onChange={handleItemChange}
          />
        </label>

        <label>
          Proteínas (g):
          <input
            type="number"
            name="proteinas_g"
            value={itemForm.proteinas_g}
            onChange={handleItemChange}
          />
        </label>

        <label>
          Grasas (g):
          <input
            type="number"
            name="grasas_g"
            value={itemForm.grasas_g}
            onChange={handleItemChange}
          />
        </label>

        <label>
          Carbohidratos (g):
          <input
            type="number"
            name="carbohidratos_g"
            value={itemForm.carbohidratos_g}
            onChange={handleItemChange}
          />
        </label>

        <button type="submit" disabled={savingItem}>
          {savingItem ? 'Guardando alimento...' : 'Agregar alimento'}
        </button>
      </form>

      {msg && <p>{msg}</p>}
    </div>
  );
}
