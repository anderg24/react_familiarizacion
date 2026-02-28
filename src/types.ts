export interface Presupuesto {
  PRE_ID: number;
  PRE_MONTO_LIMITE: number;
  PRE_TIPO_PERIODO: string;
  PRE_CATEGORIA: string;
}

export interface Gasto {
  GAS_ID: number;
  GAS_MONTO: number;
  GAS_DESCRIPCION: string;
  FECHA: string;
  PRE_ID: number;
}