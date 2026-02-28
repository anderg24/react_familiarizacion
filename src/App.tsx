import React, { useState, useEffect } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Gasto, Presupuesto } from "./types";
import { PresupuestosForm } from "./PresupuestosForm";
import "./App.css";

const API_URL = "http://localhost:3000/api";

function Home() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [loading, setLoading] = useState(true);

  // ESTADOS FORMULARIO
  const [monto, setMonto] = useState("");
  const [desc, setDesc] = useState("");
  const [preId, setPreId] = useState("");
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  // ESTADOS FILTROS
  const [filterCategoria, setFilterCategoria] = useState("");
  const [filterCampo, setFilterCampo] = useState("TODOS");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    obtenerDatos();
  }, []);

  const obtenerDatos = async () => {
    setLoading(true);
    try {
      const [resG, resP] = await Promise.all([
        axios.get(`${API_URL}/gastos`),
        axios.get(`${API_URL}/presupuestos`),
      ]);
      setGastos(resG.data);
      setPresupuestos(resP.data);
    } catch (error) {
      console.error("Error al obtener datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const calcularGastado = (id: number) => {
    return gastos
      .filter((g) => Number(g.PRE_ID) === id)
      .reduce((acc, curr) => acc + Number(curr.GAS_MONTO), 0);
  };

  const guardarGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        gas_monto: Number(monto),
        gas_descripcion: desc,
        pre_id: Number(preId),
        gas_fecha: fechaSeleccionada,
      };

      if (editId) {
        await axios.put(`${API_URL}/gastos/${editId}`, payload);
        alert("¡Gasto actualizado con éxito!");
      } else {
        await axios.post(`${API_URL}/gastos`, payload);
        alert("¡Gasto registrado con éxito!");
      }

      resetFormulario();
      obtenerDatos();
    } catch (error) {
      alert("Error al procesar la solicitud");
    }
  };

  const resetFormulario = () => {
    setEditId(null);
    setMonto("");
    setDesc("");
    setPreId("");
    setFechaSeleccionada("");
  };

  const prepararEdicion = (g: Gasto) => {
    setEditId(Number(g.GAS_ID));
    setMonto(g.GAS_MONTO.toString());
    setDesc(g.GAS_DESCRIPCION);
    setPreId(g.PRE_ID.toString());

    if (g.FECHA) {
      const [dia, mes, anio] = g.FECHA.split("-");
      setFechaSeleccionada(`${anio}-${mes}-${dia}`);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const eliminarGasto = async (id: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este gasto?")) {
      try {
        await axios.delete(`${API_URL}/gastos/${id}`);
        alert("Gasto eliminado correctamente");
        obtenerDatos();
      } catch (error) {
        alert("Error al eliminar el gasto");
      }
    }
  };

  const gastosFiltrados = gastos.filter((g) => {
    const cumpleCat =
      filterCategoria === "" || Number(g.PRE_ID) === Number(filterCategoria);
    const busqueda = searchTerm.toLowerCase();
    const descripcion = (g.GAS_DESCRIPCION || "").toLowerCase();
    const fecha = (g.FECHA || "").toLowerCase();
    const montoGasto = (g.GAS_MONTO || "").toString();

    if (!cumpleCat) return false;
    if (searchTerm === "") return true;

    switch (filterCampo) {
      case "DESCRIPCION":
        return descripcion.includes(busqueda);
      case "MONTO":
        return montoGasto.includes(busqueda);
      case "FECHA":
        return fecha.includes(busqueda);
      default:
        return (
          descripcion.includes(busqueda) ||
          fecha.includes(busqueda) ||
          montoGasto.includes(busqueda)
        );
    }
  });

  return (
    <div className="container">
      <nav className="nav-menu">
        <Link to="/" className="nav-link active">
          Gastos
        </Link>
        <Link to="/nuevo-presupuesto" className="nav-link">
          Configurar Presupuestos
        </Link>
      </nav>

      <h1>Control de Gastos Personal</h1>

      <div className="card">
        <h2>{editId ? "Editar Gasto" : "Registrar Nuevo Gasto"}</h2>
        <form onSubmit={guardarGasto}>
          <div className="form-group">
            <label>Monto (Q): </label>
            <input
              type="number"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Descripción: </label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Fecha de Gasto: </label>
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Presupuesto Asociado: </label>
            <select
              value={preId}
              onChange={(e) => setPreId(e.target.value)}
              required
            >
              <option value="">-- Seleccione una categoría --</option>
              {presupuestos.map((p) => {
                const disponible =
                  p.PRE_MONTO_LIMITE - calcularGastado(p.PRE_ID);
                return (
                  <option key={p.PRE_ID} value={p.PRE_ID}>
                    {p.PRE_CATEGORIA} ({p.PRE_TIPO_PERIODO}) - Q
                    {disponible.toFixed(2)} disp.
                  </option>
                );
              })}
            </select>
          </div>

          <button type="submit">
            {editId ? "Actualizar Gasto" : "Guardar Gasto"}
          </button>
          {editId && (
            <button
              type="button"
              onClick={resetFormulario}
              style={{ marginLeft: 10, backgroundColor: "#7f8c8d" }}
            >
              Cancelar
            </button>
          )}
        </form>
      </div>

      <div className="card">
        <h2>Historial de Gastos</h2>
        <div
          className="filter-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "15px",
            marginBottom: "20px",
            padding: "15px",
            backgroundColor: "#f1f3f5",
            borderRadius: "8px",
          }}
        >
          <div>
            <label>1. Filtrar por Presupuesto:</label>
            <select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              style={{ width: "100%", padding: "8px" }}
            >
              <option value="">Todas las categorías</option>
              {presupuestos.map((p) => (
                <option key={p.PRE_ID} value={p.PRE_ID}>
                  {p.PRE_CATEGORIA}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>2. Buscar por:</label>
            <select
              value={filterCampo}
              onChange={(e) => setFilterCampo(e.target.value)}
              style={{ width: "100%", padding: "8px" }}
            >
              <option value="TODOS">Cualquier campo</option>
              <option value="DESCRIPCION">Descripción</option>
              <option value="MONTO">Monto</option>
              <option value="FECHA">Fecha</option>
            </select>
          </div>
          <div>
            <label>3. Escribir valor:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%", padding: "8px" }}
              placeholder="Buscar..."
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Cargando...</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th>Monto</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {gastosFiltrados.map((g) => (
                  <tr key={g.GAS_ID}>
                    <td>{g.GAS_DESCRIPCION}</td>
                    <td>Q{Number(g.GAS_MONTO).toFixed(2)}</td>
                    <td>{g.FECHA}</td>
                    <td>
                      <button
                        onClick={() => prepararEdicion(g)}
                        style={{ backgroundColor: "#2980b9", marginRight: 5 }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => eliminarGasto(Number(g.GAS_ID))}
                        style={{ backgroundColor: "#c0392b" }}
                      >
                        Borrar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/nuevo-presupuesto" element={<PresupuestosForm />} />
      </Routes>
    </Router>
  );
}

export default App;
