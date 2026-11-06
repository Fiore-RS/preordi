// Modelo de datos de Preordi — ver docs/preordi-especificacion.md, sección 4.
// Montos: enteros en colones. Fechas: 'YYYY-MM-DD' locales, sin hora.

export type ID = string; // crypto.randomUUID()

/** Etapa logística de la preorden. */
export type Estado =
  | 'deseada' // en lista de deseos, aún no apartada
  | 'apartada' // ya hice la preorden
  | 'en_camino' // la tienda la despachó / ya salió
  | 'recibida' // la tengo en la mano
  | 'cancelada'; // la cancelé yo o la tienda

/** Cómo se paga esta preorden (define el flujo al apartar). */
export type TipoPago =
  | 'deposito' // parte al apartar, resto al llegar
  | 'completo' // todo al apartar
  | 'al_envio'; // nada al apartar, todo al despachar (ej. Amazon)

/** Qué tan precisa es la fecha que dio la tienda. */
export type Precision = 'dia' | 'semana' | 'mes';

export interface FechaEstimada {
  /** Para 'semana' = el lunes de esa semana; para 'mes' = primer día del mes. */
  fecha: string;
  precision: Precision;
}

export type TipoMovimiento = 'deposito' | 'abono' | 'saldo' | 'reembolso';

export interface Pago {
  id: ID;
  fecha: string;
  /** Entero > 0, siempre positivo. 'reembolso' resta al total pagado. */
  monto: number;
  tipo: TipoMovimiento;
  nota?: string;
}

export interface CostoExtra {
  id: ID;
  concepto: string;
  monto: number;
}

export interface CambioFecha {
  id: ID;
  /** Día en que me enteré del cambio. */
  registradoEl: string;
  anterior: FechaEstimada | null;
  nueva: FechaEstimada;
  nota?: string;
}

export interface Preorden {
  id: ID;
  nombre: string;
  categoriaId: ID;
  tiendaId: ID | null;

  estado: Estado;
  tipoPago: TipoPago;

  precio: number;
  costosExtra: CostoExtra[];
  pagos: Pago[];

  fechaEstimada: FechaEstimada | null;
  /** Solo reprogramaciones (no la fecha inicial). */
  historialFechas: CambioFecha[];

  fechaApartada: string | null;
  fechaEnviada: string | null;
  fechaRecibida: string | null;
  fechaCancelada: string | null;

  /** Llave en IndexedDB. */
  imagenId: ID | null;
  link?: string;
  /** Texto libre: "$45 al ₡512". */
  referenciaOriginal?: string;
  notas?: string;

  /** ISO completo. */
  creadaEl: string;
  actualizadaEl: string;
}

export interface Categoria {
  id: ID;
  nombre: string;
  emoji?: string;
  orden: number;
}

export interface Tienda {
  id: ID;
  nombre: string;
  link?: string;
  /** Política de depósito, cancelación, etc. */
  notas?: string;
}

export interface DatosPreordi {
  schemaVersion: 1;
  preordenes: Preorden[];
  categorias: Categoria[];
  tiendas: Tienda[];
}

/** Estado de pago calculado a partir de los pagos (no se guarda). */
export type EstadoPago = 'sin_pagar' | 'parcial' | 'completo';
