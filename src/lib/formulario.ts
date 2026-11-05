// Formulario de Nueva / Editar preorden — especificación 8.5, con las reglas de 5.3, 5.6 y 5.7.
// Lógica pura: la pantalla solo guarda el estado del formulario y llama a procesarFormulario().

import type { CostoExtra, Estado, FechaEstimada, ID, Precision, Preorden, TipoPago } from '../types';
import { desdeISO, normalizarFecha } from './fechas';
import { parsearMonto } from './dinero';
import { pagosAlApartar } from './estados';
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
  deposito: string;
  fechaApartada: string;

  precision: PrecisionFormulario;
  /** 'YYYY-MM-DD' para precisión 'dia'. */
  fechaDia: string;
  /** 1–12 para precisión 'mes'. */
  mes: string;
  /** 1–4 para precisión 'trimestre'. */
  trimestre: string;
  /** Año para 'mes' y 'trimestre'. */
  anio: string;

  costosExtra: FilaCostoExtra[];
  link: string;
  notas: string;
}

export type CampoConError =
  | 'nombre'
  | 'categoriaId'
  | 'precio'
  | 'deposito'
  | 'fechaApartada'
  | 'fechaEstimada'
  | 'costosExtra';

export type ErroresFormulario = Partial<Record<CampoConError, string>>;

/** Orden de los campos en pantalla, para enfocar el primer error. */
export const ORDEN_CAMPOS: CampoConError[] = [
  'nombre',
  'categoriaId',
  'precio',
  'fechaApartada',
  'deposito',
  'fechaEstimada',
  'costosExtra',
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
    mes: String(d.getMonth() + 1),
    trimestre: String(Math.floor(d.getMonth() / 3) + 1),
    anio: String(d.getFullYear()),
    costosExtra: [],
    link: '',
    notas: '',
  };
}

const conGrupos = (n: number) => new Intl.NumberFormat('es-CR').format(n);

export function formularioDesdePreorden(p: Preorden, hoy: string): FormularioPreorden {
  const base = formularioVacio(hoy, p.categoriaId, p.estado === 'deseada' ? 'deseada' : 'apartada');
  const f: FormularioPreorden = {
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
  };
  if (!p.fechaEstimada) return { ...f, precision: 'ninguna' };
  const d = desdeISO(p.fechaEstimada.fecha);
  return {
    ...f,
    precision: p.fechaEstimada.precision,
    fechaDia: p.fechaEstimada.precision === 'dia' ? p.fechaEstimada.fecha : '',
    mes: String(d.getMonth() + 1),
    trimestre: String(Math.floor(d.getMonth() / 3) + 1),
    anio: String(d.getFullYear()),
  };
}

const dos = (n: number) => String(n).padStart(2, '0');

/** Convierte la parte de fecha estimada del formulario. `undefined` = incompleta o inválida. */
export function fechaEstimadaDeFormulario(f: FormularioPreorden): FechaEstimada | null | undefined {
  if (f.precision === 'ninguna') return null;
  if (f.precision === 'dia') {
    return /^\d{4}-\d{2}-\d{2}$/.test(f.fechaDia) ? { fecha: f.fechaDia, precision: 'dia' } : undefined;
  }
  const anio = Number(f.anio);
  if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) return undefined;
  if (f.precision === 'mes') {
    const mes = Number(f.mes);
    if (!Number.isInteger(mes) || mes < 1 || mes > 12) return undefined;
    return { fecha: `${anio}-${dos(mes)}-01`, precision: 'mes' };
  }
  const t = Number(f.trimestre);
  if (!Number.isInteger(t) || t < 1 || t > 4) return undefined;
  return { fecha: normalizarFecha(`${anio}-${dos((t - 1) * 3 + 1)}-01`, 'trimestre'), precision: 'trimestre' };
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
  let deposito: number | undefined;

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
