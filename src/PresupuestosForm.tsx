import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom"; // Se eliminó useNavigate
import { Gasto, Presupuesto } from "./types";

const API_URL = "http://localhost:3000/api";

export function PresupuestosForm() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [monto, setMonto] = useState("");
  const [periodo, setPeriodo] = useState("Mensual");
  const [categoria, setCategoria] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    obtenerDatos();
  }, []);

  const obtenerDatos = async () => {
    try {
      const [resG, resP] = await Promise.all([
        axios.get(`${API_URL}/gastos`),
        axios.get(`${API_URL}/presupuestos`),
      ]);
      setGastos(resG.data);
      setPresupuestos(resP.data);
    } catch (error) {
      console.error("Error al traer datos:", error);
    }
  };

  const calcularGastado = (id: number) => {
    return gastos
      .filter((g) => Number(g.PRE_ID) === id)
      .reduce((acc, curr) => acc + Number(curr.GAS_MONTO), 0);
  };

  const registrarPresupuesto = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        pre_monto_limite: Number(monto),
        pre_tipo_periodo: periodo,
        pre_categoria: categoria,
      };

      if (editId) {
        await axios.put(`${API_URL}/presupuestos/${editId}`, payload);
        alert("Presupuesto actualizado");
      } else {
        await axios.post(`${API_URL}/presupuestos`, payload);
        alert("Presupuesto creado");
      }

      resetFormulario();
      obtenerDatos();
    } catch (error) {
      alert("Error al procesar el presupuesto");
    }
  };

  const prepararEdicion = (p: Presupuesto) => {
    setEditId(p.PRE_ID);
    setMonto(p.PRE_MONTO_LIMITE.toString());
    setPeriodo(p.PRE_TIPO_PERIODO);
    setCategoria(p.PRE_CATEGORIA);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const eliminarPresupuesto = async (id: number) => {
    if (
      window.confirm(
        "¿Seguro? Si tiene gastos asociados, no podrás eliminarlo.",
      )
    ) {
      try {
        await axios.delete(`${API_URL}/presupuestos/${id}`);
        obtenerDatos();
      } catch (error) {
        alert("Error: Existen gastos vinculados a este presupuesto.");
      }
    }
  };

  const resetFormulario = () => {
    setEditId(null);
    setMonto("");
    setCategoria("");
    setPeriodo("Mensual");
  };

  return (
    <div className="container">
      <nav className="nav-menu">
        <Link to="/" className="nav-link">
          Gastos
        </Link>
        <Link to="/nuevo-presupuesto" className="nav-link active">
          Configurar Presupuestos
        </Link>
      </nav>

      <h1>Configurar Presupuestos</h1>

      <div className="card">
        <h2>{editId ? "Editar Presupuesto" : "Registrar Nuevo Presupuesto"}</h2>
        <form onSubmit={registrarPresupuesto}>
          <div className="form-group">
            <label>Categoría:</label>
            <input
              type="text"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Monto Límite (Q):</label>
            <input
              type="number"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Periodo de Control:</label>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
            >
              <option value="Semanal">Semanal</option>
              <option value="Mensual">Mensual</option>
              <option value="Anual">Anual</option>
            </select>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            <button type="submit">{editId ? "Actualizar" : "Guardar"}</button>
            {editId && (
              <button
                type="button"
                onClick={resetFormulario}
                style={{ backgroundColor: "#7f8c8d" }}
              >
                Cancelar
              </button>
            )}
            <Link
              to="/"
              className="btn-link-style"
              style={{
                textDecoration: "none",
                backgroundColor: "#666",
                color: "white",
                padding: "10px 15px",
                borderRadius: "4px",
                textAlign: "center",
                flexGrow: 1,
              }}
            >
              Regresar a Gastos
            </Link>
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Estado Actual</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Periodo</th>
                <th>Límite</th>
                <th>Gastado</th>
                <th>Disponible</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {presupuestos.map((p) => {
                const gastado = calcularGastado(p.PRE_ID);
                const disponible = p.PRE_MONTO_LIMITE - gastado;
                return (
                  <tr key={p.PRE_ID}>
                    <td>
                      <strong>{p.PRE_CATEGORIA}</strong>
                    </td>
                    <td>{p.PRE_TIPO_PERIODO}</td>
                    <td>Q{Number(p.PRE_MONTO_LIMITE).toFixed(2)}</td>
                    <td style={{ color: "red" }}>Q{gastado.toFixed(2)}</td>
                    <td
                      style={{
                        color: disponible < 0 ? "#e67e22" : "#27ae60",
                        fontWeight: "bold",
                      }}
                    >
                      Q{disponible.toFixed(2)}
                    </td>
                    <td>
                      <button
                        onClick={() => prepararEdicion(p)}
                        style={{
                          backgroundColor: "#2980b9",
                          marginRight: "5px",
                          padding: "5px 10px",
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => eliminarPresupuesto(p.PRE_ID)}
                        style={{
                          backgroundColor: "#c0392b",
                          padding: "5px 10px",
                        }}
                      >
                        Borrar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
