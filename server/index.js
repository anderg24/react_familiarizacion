import express from 'express';
import oracledb from 'oracledb';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECTION_STRING 
};

// ================= GASTOS =================

app.get('/api/gastos', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT gas_id, gas_monto, gas_descripcion, TO_CHAR(gas_fecha, 'DD-MM-YYYY') as fecha, pre_id FROM gastos ORDER BY gas_fecha DESC`,
      [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { if (connection) await connection.close(); }
});

app.post('/api/gastos', async (req, res) => {
  // Ahora recibimos gas_fecha desde el body
  const { gas_monto, gas_descripcion, pre_id, gas_fecha } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    
    // Si el usuario no manda fecha, usamos SYSDATE, si la manda, usamos TO_DATE
    const sql = `INSERT INTO gastos (gas_monto, gas_descripcion, pre_id, gas_fecha) 
                 VALUES (:gas_monto, :gas_descripcion, :pre_id, 
                 ${gas_fecha ? "TO_DATE(:gas_fecha, 'YYYY-MM-DD')" : "SYSDATE"})`;

    const binds = { gas_monto, gas_descripcion, pre_id };
    if (gas_fecha) binds.gas_fecha = gas_fecha;

    await connection.execute(sql, binds, { autoCommit: true });
    res.status(201).json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { if (connection) await connection.close(); }
});

app.put('/api/gastos/:id', async (req, res) => {
  const { id } = req.params;
  const { gas_monto, gas_descripcion, pre_id, gas_fecha } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    
    // Ahora incluimos gas_fecha en el UPDATE
    const sql = `UPDATE gastos 
                 SET gas_monto = :gas_monto, 
                     gas_descripcion = :gas_descripcion, 
                     pre_id = :pre_id,
                     gas_fecha = TO_DATE(:gas_fecha, 'YYYY-MM-DD')
                 WHERE gas_id = :id`;

    const result = await connection.execute(
      sql, 
      { gas_monto, gas_descripcion, pre_id, gas_fecha, id }, 
      { autoCommit: true }
    );
    res.json({ ok: true, rowsAffected: result.rowsAffected });
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { if (connection) await connection.close(); }
});

app.delete('/api/gastos/:id', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(`DELETE FROM gastos WHERE gas_id = :id`, { id: req.params.id }, { autoCommit: true });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { if (connection) await connection.close(); }
});

// ================= PRESUPUESTOS =================

app.get('/api/presupuestos', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT pre_id, pre_monto_limite, pre_tipo_periodo, pre_categoria, TO_CHAR(pre_fecha_inicio, 'DD-MM-YYYY') as fecha FROM presupuestos ORDER BY pre_fecha_inicio DESC`,
      [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { if (connection) await connection.close(); }
});

app.post('/api/presupuestos', async (req, res) => {
  const { pre_monto_limite, pre_tipo_periodo, pre_categoria, pre_fecha_inicio } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sql = `INSERT INTO presupuestos (pre_monto_limite, pre_tipo_periodo, pre_categoria, pre_fecha_inicio) 
                 VALUES (:pre_monto_limite, :pre_tipo_periodo, :pre_categoria, 
                 ${pre_fecha_inicio ? "TO_DATE(:pre_fecha_inicio, 'YYYY-MM-DD')" : "SYSDATE"})`;
    
    const binds = { pre_monto_limite, pre_tipo_periodo, pre_categoria };
    if (pre_fecha_inicio) binds.pre_fecha_inicio = pre_fecha_inicio;

    await connection.execute(sql, binds, { autoCommit: true });
    res.status(201).json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { if (connection) await connection.close(); }
});

app.put('/api/presupuestos/:id', async (req, res) => {
  const { id } = req.params;
  const { pre_monto_limite, pre_tipo_periodo, pre_categoria, pre_fecha_inicio } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sql = `UPDATE presupuestos 
                 SET pre_monto_limite = :pre_monto_limite, 
                     pre_tipo_periodo = :pre_tipo_periodo, 
                     pre_categoria = :pre_categoria,
                     pre_fecha_inicio = TO_DATE(:pre_fecha_inicio, 'YYYY-MM-DD')
                 WHERE pre_id = :id`;
    await connection.execute(sql, { pre_monto_limite, pre_tipo_periodo, pre_categoria, pre_fecha_inicio, id }, { autoCommit: true });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { if (connection) await connection.close(); }
});

app.delete('/api/presupuestos/:id', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(`DELETE FROM presupuestos WHERE pre_id = :id`, { id: req.params.id }, { autoCommit: true });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: "Error: Posibles gastos asociados" }); }
  finally { if (connection) await connection.close(); }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));