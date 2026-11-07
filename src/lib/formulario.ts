// Formulario de Nueva / Editar preorden — especificación 8.5, con las reglas de 5.3, 5.6 y 5.7.
// Lógica pura: la pantalla solo guarda el estado del formulario y llama a procesarFormulario().

import type { CostoExtra, Estado, FechaEstimada, ID, Precision, Preorden, TipoPago } from '../types';
import { desdeISO, normalizarFecha } from './fechas';
import { parsearMonto } from './dinero';
import { pagosAlApartar } from './estados';
import { preventaDeCampos } from './preventa';
import { nuevoId } from './ids';

export type PrecisionFormulario = Precision | 'ninguna';

export interface FilaCostoExtra {
  id: ID;
  concepto: string;
  monto: string;
}

export interface FormularioPreorden {
  nombre: string;
  categoriaId: ID;
  tiendaId: ID | null;
  precio: string;
  referenciaOriginal: string;

  /** Solo al crear. */
  estadoInicial: Extract<Estado, 'deseada' | 'apartada'>;
  tipoPago: TipoPago;
  /** Al apartar: el depósito pagado. En un deseo: el depósito que pide la tienda (opcional). */
  deposito: string;
  fechaApartada: string;

  precision: PrecisionFormulario;
  /** 'YYYY-MM-DD' para precisión 'dia'. */
  fechaDia: string;
  /** 1–12 para precisión 'mes'. */
  mes: string;
  /** Cualquier día de la semana elegida (se guarda el lunes) para precisión 'semana'. */
  fechaSemana: string;
  /** Año para 'mes'. */
  anio: string;

  costosExtra: FilaCostoExtra[];
  link: string;
  notas: string;

  /** Solo deseos (5.9): 'YYYY-MM-DD' o vacío. */
  preventaAbre: string;
  preventaCierra: string;
  /** 'HH:MM' o vacío. */
  preventaHora: string;
}

export type CampoConError =
  | 'nombre'
  | 'categoriaId'
  | 'precio'
  | 'deposito'
  | 'fechaApartada'
  | 'fechaEstimada'
  | 'costosExtra'
  | 'preventa';

/** La parte del formulario que describe la fecha estimada (también la usa la hoja Cambiar fecha). */
export type ValoresFecha = Pick<FormularioPreorden, 'precision' | 'fechaDia' | 'fechaSemana' | 'mes' | 'anio'>;

export type ErroresFormulario = Partial<Record<CampoConError, string>>;

/** Orden de los campos en pantalla, para enfocar el primer error. */
export const ORDEN_CAMPOS: CampoConError[] = [
  'nombre',
  'categoriaId',
  'precio',
  'costosExtra',
  'preventa',
  'deposito',
  'fechaApartada',
  'fechaEstimada',
];

export function formularioVacio(
  hoy: string,
  categoriaId: ID,
  estadoInicial: FormularioPreorden['estadoInicial'] = 'apartada',
): FormularioPreorden {
  const d = desdeISO(hoy);
  return {
    nombre: '',
    categoriaId,
    tiendaId: null,
    precio: '',
    referenciaOriginal: '',
    estadoInicial,
    tipoPago: 'deposito',
    deposito: '',
    fechaApartada: hoy,
    precision: 'mes',
    fechaDia: '',
    fechaSemana: '',
    mes: String(d.getMonth() + 1),
    anio: String(d.getFullYear()),
    costosExtra: [],
    link: '',
    notas: '',
    preventaAbre: '',
    preventaCierra: '',
    preventaHora: '',
  };
}

const conGrupos = (n: number) => new Intl.NumberFormat('es-CR').format(n);

/** Valores del selector de fecha a partir de una fecha estimada (o los de hoy si no hay). */
export function valoresFecha(fe: FechaEstimada | null, hoy: string): ValoresFecha {
  const d = desdeISO(fe?.fecha ?? hoy);
  return {
    precision: fe ? fe.precision : 'ninguna',
    fechaDia: fe?.precision === 'dia' ? fe.fecha : '',
    fechaSemana: fe?.precision === 'semana' ? fe.fecha : '',
    mes: String(d.getMonth() + 1),
    anio: String(d.getFullYear()),
  };
}

export function formularioDesdePreorden(p: Preorden, hoy: string): FormularioPreorden {
  const base = formularioVacio(hoy, p.categoriaId, p.estado === 'deseada' ? 'deseada' : 'apartada');
  return {
    ...base,
    nombre: p.nombre,
    tiendaId: p.tiendaId,
    precio: conGrupos(p.precio),
    referenciaOriginal: p.referenciaOriginal ?? '',
    tipoPago: p.tipoPago,
    fechaApartada: p.fechaApartada ?? hoy,
    costosExtra: p.costosExtra.map((c) => ({ id: c.id, concepto: c.concepto, monto: conGrupos(c.monto) })),
    link: p.link ?? '',
    notas: p.notas ?? '',
    deposito: p.estado === 'deseada' && p.depositoEstimado ? conGrupos(p.depositoEstimado) : '',
    preventaAbre: p.preventa?.abre ?? '',
    preventaCierra: p.preventa?.cierra ?? '',
    preventaHora: p.preventa?.horaCierre ?? '',
    ...valoresFecha(p.fechaEstimada, hoy),
  };
}

const dos = (n: number) => String(n).padStart(2, '0');

/** Convierte la parte de fecha estimada del formulario. `undefined` = incompleta o inválida. */
export function fechaEstimadaDeFormulario(f: ValoresFecha): FechaEstimada | null | undefined {
  if (f.precision === 'ninguna') return null;
  if (f.precision === 'dia') {
    return /^\d{4}-\d{2}-\d{2}$/.test(f.fechaDia) ? { fecha: f.fechaDia, precision: 'dia' } : undefined;
  }
  if (f.precision === 'semana') {
    return /^\d{4}-\d{2}-\d{2}$/.test(f.fechaSemana)
      ? { fecha: normalizarFecha(f.fechaSemana, 'semana'), precision: 'semana' }
      : undefined;
  }
  const anio = Number(f.anio);
  if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) return undefined;
  const mes = Number(f.mes);
  if (!Number.isInteger(mes) || mes < 1 || mes > 12) return undefined;
  return { fecha: `${anio}-${dos(mes)}-01`, precision: 'mes' };
}

function mismaFecha(a: FechaEstimada | null, b: FechaEstimada | null): boolean {
  return a?.fecha === b?.fecha && a?.precision === b?.precision;
}

const opcional = (texto: string) => (texto.trim() ? texto.trim() : undefined);

/** Costos extra válidos. Las filas totalmente vacías se ignoran. `undefined` si alguna está a medias. */
export function costosDeFormulario(filas: FilaCostoExtra[]): CostoExtra[] | undefined {
  const costos: CostoExtra[] = [];
  for (const fila of filas) {
    if (!fila.concepto.trim() && !fila.monto.trim()) continue;
    const monto = parsearMonto(fila.monto);
    if (!fila.concepto.trim() || monto === null) return undefined;
    costos.push({ id: fila.id, concepto: fila.concepto.trim(), monto });
  }
  return costos;
}

/** Costo total con lo que hay escrito ahora (0 si el precio aún no es válido). */
export function costoDeFormulario(f: FormularioPreorden): number {
  const precio = parsearMonto(f.precio) ?? 0;
  const extras = costosDeFormulario(f.costosExtra) ?? [];
  return precio + extras.reduce((suma, c) => suma + c.monto, 0);
}

export type ResultadoFormulario =
  | { ok: true; preorden: Preorden }
  | { ok: false; errores: ErroresFormulario };

interface Contexto {
  hoy: string;
  ahoraISO: string;
  /** Si viene, se edita esa preorden; si no, se crea una nueva. */
  original?: Preorden;
}

export function procesarFormulario(f: FormularioPreorden, { hoy, ahoraISO, original }: Contexto): ResultadoFormulario {
  const errores: ErroresFormulario = {};

  const nombre = f.nombre.trim();
  if (!nombre) errores.nombre = 'Escribí el nombre.';
  if (!f.categoriaId) errores.categoriaId = 'Elegí una categoría.';

  const precio = parsearMonto(f.precio);
  if (precio === null) errores.precio = 'Escribí un precio mayor que ₡0.';

  const costosExtra = costosDeFormulario(f.costosExtra);
  if (!costosExtra) errores.costosExtra = 'Cada costo extra necesita concepto y monto.';

  const fechaEstimada = fechaEstimadaDeFormulario(f);
  if (fechaEstimada === undefined) errores.fechaEstimada = 'Completá la fecha estimada o elegí "Sin fecha".';

  const costo = (precio ?? 0) + (costosExtra ?? []).reduce((suma, c) => suma + c.monto, 0);
  const apartarAhora = !original && f.estadoInicial === 'apartada';
  const esDeseo = original ? original.estado === 'deseada' : f.estadoInicial === 'deseada';
  let deposito: number | undefined;

  // Deseos (5.9): fechas de la preventa y depósito que pide la tienda, ambos opcionales.
  let datosDeseo: Pick<Preorden, 'preventa' | 'depositoEstimado' | 'tipoPago'> | undefined;
  if (esDeseo) {
    const preventa = preventaDeCampos(f.preventaAbre, f.preventaCierra, f.preventaHora);
    if (!preventa.ok) errores.preventa = preventa.error;
    let depositoEstimado: number | undefined;
    if (f.tipoPago === 'deposito' && f.deposito.trim()) {
      depositoEstimado = parsearMonto(f.deposito) ?? undefined;
      if (depositoEstimado === undefined) errores.deposito = 'Escribí un monto mayor que ₡0 o dejalo vacío.';
      else if (precio !== null && depositoEstimado >= costo) errores.deposito = 'El depósito tiene que ser menor que el costo total.';
    }
    datosDeseo = { preventa: preventa.ok ? preventa.preventa : undefined, depositoEstimado, tipoPago: f.tipoPago };
  }

  if (apartarAhora) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.fechaApartada)) errores.fechaApartada = 'Elegí la fecha en que la apartaste.';
    if (f.tipoPago === 'deposito') {
      deposito = parsearMonto(f.deposito) ?? undefined;
      if (deposito === undefined) errores.deposito = 'Escribí el monto del depósito.';
      else if (precio !== null && deposito >= costo) errores.deposito = 'El depósito tiene que ser menor que el costo total.';
    }
  }

  if (Object.keys(errores).length > 0 || precio === null || !costosExtra || fechaEstimada === undefined) {
    return { ok: false, errores };
  }

  const comunes = {
    nombre,
    categoriaId: f.categoriaId,
    tiendaId: f.tiendaId,
    precio,
    costosExtra,
    fechaEstimada,
    link: opcional(f.link),
    referenciaOriginal: opcional(f.referenciaOriginal),
    notas: opcional(f.notas),
    ...datosDeseo,
    actualizadaEl: ahoraISO,
  };

  if (original) {
    const historialFechas =
      original.fechaEstimada && !mismaFecha(original.fechaEstimada, fechaEstimada) && fechaEstimada
        ? [
            ...original.historialFechas,
            { id: nuevoId(), registradoEl: hoy, anterior: original.fechaEstimada, nueva: fechaEstimada },
          ]
        : original.historialFechas;
    return { ok: true, preorden: { ...original, ...comunes, historialFechas } };
  }

  return {
    ok: true,
    preorden: {
      id: nuevoId(),
      ...comunes,
      estado: f.estadoInicial,
      tipoPago: f.tipoPago,
      pagos: apartarAhora ? pagosAlApartar(f.tipoPago, costo, f.fechaApartada, deposito) : [],
      historialFechas: [],
      fechaApartada: apartarAhora ? f.fechaApartada : null,
      fechaEnviada: null,
      fechaRecibida: null,
      fechaCancelada: null,
      imagenId: null,
      creadaEl: ahoraISO,
    },
  };
}
