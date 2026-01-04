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

  // peso de referencia para agua recomendada
  const [pesoRefKg, setPesoRefKg] = useState('');

  // edición de items
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemData, setEditingItemData] = useState({
    tiempo: '',
    alimento: '',
    equivalente: '',
    cantidad: '',
    unidad: '',
  });

  // autocompletado durante edición
  const [editingFoodResults, setEditingFoodResults] = useState([]);
  const [editingSelectedFood, setEditingSelectedFood] = useState(null);

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

  // Cargar peso de referencia desde el último InBody (opcional)
  useEffect(() => {
    const fetchLastInbody = async () => {
      const { data, error } = await supabase
        .from('inbody_records')
        .select('peso_kg')
        .eq('patient_id', patientId)
        .order('fecha', { ascending: false })
        .limit(1)
        .single()
        .catch(() => ({ data: null, error: null }));

      if (!error && data?.peso_kg) {
        setPesoRefKg(data.peso_kg.toString());
      }
    };

    fetchLastInbody();
  }, [patientId]);

  const aguaRecomendadaMl = useMemo(() => {
    const p = parseFloat(pesoRefKg) || 0;
    return p > 0 ? p * 35 : 0;
  }, [pesoRefKg]);

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

  // Buscar alimentos en Supabase cuando el usuario escribe (form de agregar alimento)
  useEffect(() => {
    const fetchFoods = async () => {
      const q = searchAlimento.trim();
      if (!q) {
        setFoodResults([]);
        setSelectedFood(null);
        return;
      }

      const { data, error } = await supabase
        .from('alimentos')
        .select(`
          *,
          energia_kcal,
          proteina_g,
          lipidos_g,
          carbohidratos_g,
          gramos,
          ag_g,
          colesterol_mg,
          fibra_g,
          azucar_g,
          vitaminas_mg,
          minerales_mg,
          ig,
          carga_glucemica
        `)
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
      equivalente: `${food.cantidad_sugerida || ''} ${
        food.unidad || ''
      }`.trim(),
      unidad: food.unidad || '',
      cantidad: prev.cantidad || '1',
    }));
  };

  // cálculo macros del alimento seleccionado * cantidad (form agregar)
  const selectedFoodMacros = useMemo(() => {
    if (!selectedFood) return null;
    const cantidadNum = parseFloat(itemForm.cantidad) || 1;

    const kcal =
      (Number(selectedFood.energia_kcal) || 0) * cantidadNum;
    const prot =
      (Number(selectedFood.proteina_g) || 0) * cantidadNum;
    const fat = (Number(selectedFood.lipidos_g) || 0) * cantidadNum;
    const carb =
      (Number(selectedFood.carbohidratos_g) || 0) * cantidadNum;

    const gramos =
      (Number(selectedFood.gramos) || 0) * cantidadNum;
    const ag =
      (Number(selectedFood.ag_g) || 0) * cantidadNum;
    const col =
      (Number(selectedFood.colesterol_mg) || 0) * cantidadNum;
    const fibra =
      (Number(selectedFood.fibra_g) || 0) * cantidadNum;
    const azucar =
      (Number(selectedFood.azucar_g) || 0) * cantidadNum;
    const vit =
      (Number(selectedFood.vitaminas_mg) || 0) * cantidadNum;
    const min =
      (Number(selectedFood.minerales_mg) || 0) * cantidadNum;
    const igVal = selectedFood.ig ?? null;
    const carga =
      (Number(selectedFood.carga_glucemica) || 0) * cantidadNum;

    return {
      calorias: kcal,
      proteinas_g: prot,
      grasas_g: fat,
      carbohidratos_g: carb,
      gramos,
      ag_g: ag,
      colesterol_mg: col,
      fibra_g: fibra,
      azucar_g: azucar,
      vitaminas_mg: vit,
      minerales_mg: min,
      ig: igVal,
      carga_glucemica: carga,
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

    const macros =
      selectedFoodMacros || {
        calorias: null,
        proteinas_g: null,
        grasas_g: null,
        carbohidratos_g: null,
        gramos: null,
        ag_g: null,
        colesterol_mg: null,
        fibra_g: null,
        azucar_g: null,
        vitaminas_mg: null,
        minerales_mg: null,
        ig: null,
        carga_glucemica: null,
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
      gramos: macros.gramos,
      ag_g: macros.ag_g,
      colesterol_mg: macros.colesterol_mg,
      fibra_g: macros.fibra_g,
      azucar_g: macros.azucar_g,
      vitaminas_mg: macros.vitaminas_mg,
      minerales_mg: macros.minerales_mg,
      ig: macros.ig,
      carga_glucemica: macros.carga_glucemica,
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

  // --------- EDICIÓN Y ELIMINACIÓN DE ITEMS ----------

  const startEditItem = (item) => {
    setEditingItemId(item.id);
    setEditingItemData({
      tiempo: item.tiempo || '',
      alimento: item.alimento || '',
      equivalente: item.equivalente || '',
      cantidad:
        item.cantidad !== null && item.cantidad !== undefined
          ? String(item.cantidad)
          : '',
      unidad: item.unidad || '',
    });
    setEditingFoodResults([]);
    setEditingSelectedFood(null);
    setMsg('');
  };

  const cancelEditItem = () => {
    setEditingItemId(null);
    setEditingItemData({
      tiempo: '',
      alimento: '',
      equivalente: '',
      cantidad: '',
      unidad: '',
    });
    setEditingFoodResults([]);
    setEditingSelectedFood(null);
  };

  const handleEditingItemChange = (field, value) => {
    setEditingItemData((prev) => ({ ...prev, [field]: value }));
  };

  // Autocompletado cuando se edita el alimento
  useEffect(() => {
    const fetchFoodsEditing = async () => {
      if (!editingItemId) {
        setEditingFoodResults([]);
        return;
      }
      const q = editingItemData.alimento.trim();
      if (!q) {
        setEditingFoodResults([]);
        setEditingSelectedFood(null);
        return;
      }

      const { data, error } = await supabase
        .from('alimentos')
        .select(`
          *,
          energia_kcal,
          proteina_g,
          lipidos_g,
          carbohidratos_g,
          gramos,
          ag_g,
          colesterol_mg,
          fibra_g,
          azucar_g,
          vitaminas_mg,
          minerales_mg,
          ig,
          carga_glucemica
        `)
        .ilike('nombre', `%${q}%`)
        .limit(20);

      if (error) {
        console.error(error);
        setEditingFoodResults([]);
      } else {
        setEditingFoodResults(data || []);
      }
    };

    fetchFoodsEditing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingItemData.alimento, editingItemId]);

  const handleSelectEditingFood = (food) => {
    setEditingSelectedFood(food);
    setEditingItemData((prev) => ({
      ...prev,
      alimento: food.nombre,
      unidad: food.unidad || '',
      equivalente: `${food.cantidad_sugerida || ''} ${
        food.unidad || ''
      }`.trim(),
    }));
    setEditingFoodResults([]);
  };

  const saveEditItem = async () => {
    if (!editingItemId) return;

    // payload base (texto)
    let payload = {
      tiempo: editingItemData.tiempo,
      alimento: editingItemData.alimento,
      equivalente: editingItemData.equivalente,
      cantidad: editingItemData.cantidad
        ? parseFloat(editingItemData.cantidad)
        : null,
      unidad: editingItemData.unidad,
    };

    // si seleccionó un alimento del autocompletado, recalculamos macros
    if (editingSelectedFood) {
      const cantidadNum =
        parseFloat(editingItemData.cantidad) || 1;

      const kcal =
        (Number(editingSelectedFood.energia_kcal) || 0) *
        cantidadNum;
      const prot =
        (Number(editingSelectedFood.proteina_g) || 0) *
        cantidadNum;
      const fat =
        (Number(editingSelectedFood.lipidos_g) || 0) *
        cantidadNum;
      const carb =
        (Number(
          editingSelectedFood.carbohidratos_g
        ) || 0) * cantidadNum;

      const gramos =
        (Number(editingSelectedFood.gramos) || 0) *
        cantidadNum;
      const ag =
        (Number(editingSelectedFood.ag_g) || 0) *
        cantidadNum;
      const col =
        (Number(editingSelectedFood.colesterol_mg) || 0) *
        cantidadNum;
      const fibra =
        (Number(editingSelectedFood.fibra_g) || 0) *
        cantidadNum;
      const azucar =
        (Number(editingSelectedFood.azucar_g) || 0) *
        cantidadNum;
      const vit =
        (Number(editingSelectedFood.vitaminas_mg) || 0) *
        cantidadNum;
      const min =
        (Number(editingSelectedFood.minerales_mg) || 0) *
        cantidadNum;
      const igVal = editingSelectedFood.ig ?? null;
      const carga =
        (Number(
          editingSelectedFood.carga_glucemica
        ) || 0) * cantidadNum;

      payload = {
        ...payload,
        calorias: kcal,
        proteinas_g: prot,
        grasas_g: fat,
        carbohidratos_g: carb,
        gramos,
        ag_g: ag,
        colesterol_mg: col,
        fibra_g: fibra,
        azucar_g: azucar,
        vitaminas_mg: vit,
        minerales_mg: min,
        ig: igVal,
        carga_glucemica: carga,
      };
    }

    const { data, error } = await supabase
      .from('menu_items')
      .update(payload)
      .eq('id', editingItemId)
      .select()
      .single();

    if (error) {
      console.error(error);
      setMsg('Error al actualizar alimento');
      return;
    }

    setItems((prev) =>
      prev.map((it) => (it.id === editingItemId ? data : it))
    );
    cancelEditItem();
    setMsg('Alimento actualizado');
  };

  const deleteItem = async (id) => {
    const ok = window.confirm(
      '¿Seguro que quieres eliminar este alimento del menú?'
    );
    if (!ok) return;

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(error);
      setMsg('Error al eliminar alimento');
      return;
    }

    setItems((prev) => prev.filter((it) => it.id !== id));
    if (editingItemId === id) {
      cancelEditItem();
    }
    setMsg('Alimento eliminado');
  };

  // --------- ELIMINAR MENÚ COMPLETO ----------

  const handleDeleteMenu = async () => {
    if (!selectedMenuId) return;

    const ok = window.confirm(
      '¿Seguro que quieres eliminar este menú y todos sus alimentos?'
    );
    if (!ok) return;

    // Primero eliminamos sus items
    const { error: itemsError } = await supabase
      .from('menu_items')
      .delete()
      .eq('menu_id', selectedMenuId);

    if (itemsError) {
      console.error(itemsError);
      setMsg('Error al eliminar alimentos del menú');
      return;
    }

    const { error: menuError } = await supabase
      .from('menus')
      .delete()
      .eq('id', selectedMenuId);

    if (menuError) {
      console.error(menuError);
      setMsg('Error al eliminar menú');
      return;
    }

    setMenus((prev) => prev.filter((m) => m.id !== selectedMenuId));

    setSelectedMenuId((prevId) => {
      const remaining = menus.filter((m) => m.id !== prevId);
      return remaining.length ? remaining[0].id : null;
    });

    setItems([]);
    cancelEditItem();
    setMsg('Menú eliminado');
  };

  if (loading) return <div>Cargando menús...</div>;

  return (
    <div className="menu-tab">
      <h3>Menús / Plan de alimentación</h3>

      {/* SELECCIÓN DE MENÚ EXISTENTE */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
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

        {/* AHORA VERDE: usamos btn-primary */}
        <button
          type="button"
          className="btn-primary"
          onClick={handleDeleteMenu}
          disabled={!selectedMenuId}
        >
          Eliminar menú
        </button>
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
            <th>Gramos</th>
            <th>AG (g)</th>
            <th>Colest. (mg)</th>
            <th>Fibra (g)</th>
            <th>Azúcar (g)</th>
            <th>Vit. (mg)</th>
            <th>Min. (mg)</th>
            <th>IG</th>
            <th>Carga gluc.</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={19}>Sin alimentos aún.</td>
            </tr>
          )}
          {items.map((it) => {
            const isEditing = editingItemId === it.id;
            return (
              <tr key={it.id}>
                {/* Tiempo */}
                <td>
                  {isEditing ? (
                    <select
                      value={editingItemData.tiempo}
                      onChange={(e) =>
                        handleEditingItemChange(
                          'tiempo',
                          e.target.value
                        )
                      }
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Desayuno">Desayuno</option>
                      <option value="Colación 1">
                        Colación 1
                      </option>
                      <option value="Comida">Comida</option>
                      <option value="Colación 2">
                        Colación 2
                      </option>
                      <option value="Cena">Cena</option>
                    </select>
                  ) : (
                    it.tiempo
                  )}
                </td>

                {/* Alimento */}
                <td style={{ position: 'relative' }}>
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={editingItemData.alimento}
                        onChange={(e) =>
                          handleEditingItemChange(
                            'alimento',
                            e.target.value
                          )
                        }
                        placeholder="Escribe parte del alimento"
                      />
                      {editingFoodResults.length > 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            maxHeight: 160,
                            overflowY: 'auto',
                            borderRadius: 8,
                            border: '1px solid #374151',
                            background: '#020617',
                            zIndex: 20,
                          }}
                        >
                          {editingFoodResults.map((food) => (
                            <div
                              key={food.id}
                              style={{
                                padding: '4px 6px',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                              }}
                              onClick={() =>
                                handleSelectEditingFood(food)
                              }
                            >
                              <strong>{food.nombre}</strong>{' '}
                              <span style={{ color: '#9ca3af' }}>
                                ({food.grupo} –{' '}
                                {food.cantidad_sugerida}{' '}
                                {food.unidad})
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    it.alimento
                  )}
                </td>

                {/* Equivalente */}
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingItemData.equivalente}
                      onChange={(e) =>
                        handleEditingItemChange(
                          'equivalente',
                          e.target.value
                        )
                      }
                    />
                  ) : (
                    it.equivalente
                  )}
                </td>

                {/* Cantidad */}
                <td>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.25"
                      value={editingItemData.cantidad}
                      onChange={(e) =>
                        handleEditingItemChange(
                          'cantidad',
                          e.target.value
                        )
                      }
                    />
                  ) : (
                    it.cantidad
                  )}
                </td>

                {/* Unidad */}
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingItemData.unidad}
                      onChange={(e) =>
                        handleEditingItemChange(
                          'unidad',
                          e.target.value
                        )
                      }
                    />
                  ) : (
                    it.unidad
                  )}
                </td>

                {/* Macros y nuevos campos (solo lectura) */}
                <td>{it.calorias ?? '-'}</td>
                <td>{it.proteinas_g ?? '-'}</td>
                <td>{it.grasas_g ?? '-'}</td>
                <td>{it.carbohidratos_g ?? '-'}</td>
                <td>{it.gramos ?? '-'}</td>
                <td>{it.ag_g ?? '-'}</td>
                <td>{it.colesterol_mg ?? '-'}</td>
                <td>{it.fibra_g ?? '-'}</td>
                <td>{it.azucar_g ?? '-'}</td>
                <td>{it.vitaminas_mg ?? '-'}</td>
                <td>{it.minerales_mg ?? '-'}</td>
                <td>{it.ig ?? '-'}</td>
                <td>{it.carga_glucemica ?? '-'}</td>

                {/* Acciones */}
                <td>
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={saveEditItem}
                        style={{ marginRight: 4 }}
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={cancelEditItem}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      {/* EDITAR VERDE */}
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => startEditItem(it)}
                        style={{ marginRight: 4 }}
                      >
                        Editar
                      </button>
                      {/* Eliminar alimento se queda rojo */}
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={() => deleteItem(it.id)}
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
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

        {/* Ayuda para agua recomendada */}
        <div
          style={{
            gridColumn: '1 / -1',
            marginTop: 4,
            fontSize: '0.8rem',
            color: '#9ca3af',
          }}
        >
          <div style={{ marginBottom: 4 }}>
            Peso de referencia (kg):{' '}
            <input
              type="number"
              step="0.1"
              style={{ maxWidth: 90, marginLeft: 4 }}
              value={pesoRefKg}
              onChange={(e) => setPesoRefKg(e.target.value)}
            />
          </div>
          <div>
            Recomendado (peso × 35 ml):{' '}
            {aguaRecomendadaMl
              ? `${aguaRecomendadaMl.toFixed(0)} ml (${(
                  aguaRecomendadaMl / 1000
                ).toFixed(2)} L)`
              : '-'}{' '}
            <button
              type="button"
              style={{ marginLeft: 8 }}
              onClick={() =>
                setMenuForm((prev) => ({
                  ...prev,
                  agua_ml: aguaRecomendadaMl
                    ? aguaRecomendadaMl.toFixed(0)
                    : '',
                }))
              }
            >
              Usar recomendación
            </button>
          </div>
        </div>

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

        {/* Lista de sugerencias (agregar alimento) */}
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
              {Number(selectedFood.energia_kcal) || 0} kcal por
              porción → {selectedFoodMacros.calorias.toFixed(1)}{' '}
              kcal totales
            </p>
            <p style={{ margin: '4px 0' }}>
              Prot:{' '}
              {Number(selectedFood.proteina_g) || 0} g por porción →{' '}
              {selectedFoodMacros.proteinas_g.toFixed(1)} g
              <br />
              Grasas:{' '}
              {Number(selectedFood.lipidos_g) || 0} g por porción →{' '}
              {selectedFoodMacros.grasas_g.toFixed(1)} g
              <br />
              CHO:{' '}
              {Number(selectedFood.carbohidratos_g) || 0} g por
              porción →{' '}
              {selectedFoodMacros.carbohidratos_g.toFixed(1)} g
            </p>
            <p style={{ margin: '4px 0' }}>
              Gramos: {selectedFoodMacros.gramos.toFixed(1)} g, AG:{' '}
              {selectedFoodMacros.ag_g.toFixed(1)} g, Fibra:{' '}
              {selectedFoodMacros.fibra_g.toFixed(1)} g, Azúcar:{' '}
              {selectedFoodMacros.azucar_g.toFixed(1)} g
              <br />
              Colesterol:{' '}
              {selectedFoodMacros.colesterol_mg.toFixed(1)} mg,
              Vit.: {selectedFoodMacros.vitaminas_mg.toFixed(1)} mg,
              Min.: {selectedFoodMacros.minerales_mg.toFixed(1)} mg
              <br />
              IG:{' '}
              {selectedFoodMacros.ig !== null
                ? selectedFoodMacros.ig
                : '-'}
              , Carga glucémica:{' '}
              {selectedFoodMacros.carga_glucemica.toFixed(1)}
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
