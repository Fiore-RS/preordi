// Fechas de preventa de los deseos — especificación 5.9.
// Un deseo puede tener fecha en que abre la preventa y fecha (y hora) en que cierra.
// Cuando faltan pocos días para el cierre sale un aviso en Inicio; si la fecha pasa, el deseo queda "cerrado".

import type { Preorden, Preventa } from '../types';
import { costoTotal } from './calculos';
import { MESES, aISO, desdeISO } from './fechas';

/** Desde cuántos días antes del cierre sale el aviso en Inicio. */
export const DIAS_AVISO = 7;
/** Desde cuántos días antes el aviso pasa a naranja. */
export const DIAS_URGENTE = 2;

export type FasePreventa = 'sin_fechas' | 'proximamente' | 'abierta' | 'cerrada';
export type Urgencia = 'ninguna' | 'aviso' | 'urgente' | 'hoy';

export interface InfoPreventa {
  fase: FasePreventa;
  /** Días que faltan para el cierre (0 = cierra hoy). null si no hay cierre o ya cerró. */
  diasParaCierre: number | null;
  urgencia: Urgencia;
}

const SIN_FECHAS: InfoPreventa = { fase: 'sin_fechas', diasParaCierre: null, urgencia: 'ninguna' };
const dos = (n: number) => String(n).padStart(2, '0');

/** Días de calendario entre dos fechas 'YYYY-MM-DD' (positivo si `hasta` es después). */
export function diasEntre(desde: string, hasta: string): number {
  return Math.round((desdeISO(hasta).getTime() - desdeISO(desde).getTime()) / 86_400_000);
}

function yaCerro(pv: Preventa, ahora: Date): boolean {
  if (!pv.cierra) return false;
  const hoy = aISO(ahora);
  if (hoy !== pv.cierra) return hoy > pv.cierra;
  if (!pv.horaCierre) return false;
  return `${dos(ahora.getHours())}:${dos(ahora.getMinutes())}` >= pv.horaCierre;
}

export function tienePreventa(p: Preorden): boolean {
  return !!p.preventa && (!!p.preventa.abre || !!p.preventa.cierra);
}

/** En qué punto está la preventa de un deseo. Las preórdenes que no son deseos no tienen preventa. */
export function infoPreventa(p: Preorden, ahora: Date): InfoPreventa {
  const pv = p.preventa;
  if (p.estado !== 'deseada' || !pv || !tienePreventa(p)) return SIN_FECHAS;
  if (yaCerro(pv, ahora)) return { fase: 'cerrada', diasParaCierre: null, urgencia: 'ninguna' };

  const hoy = aISO(ahora);
  const dias = pv.cierra ? diasEntre(hoy, pv.cierra) : null;
  if (pv.abre && hoy < pv.abre) return { fase: 'proximamente', diasParaCierre: dias, urgencia: 'ninguna' };

  let urgencia: Urgencia = 'ninguna';
  if (dias !== null) {
    if (dias <= 0) urgencia = 'hoy';
    else if (dias <= DIAS_URGENTE) urgencia = 'urgente';
    else if (dias <= DIAS_AVISO) urgencia = 'aviso';
  }
  return { fase: 'abierta', diasParaCierre: dias, urgencia };
}

const PESO_URGENCIA: Record<Urgencia, number> = { ninguna: 0, aviso: 1, urgente: 2, hoy: 3 };

export function masUrgente(lista: Urgencia[]): Urgencia {
  return lista.reduce<Urgencia>((max, u) => (PESO_URGENCIA[u] > PESO_URGENCIA[max] ? u : max), 'ninguna');
}

/** Momento de cierre comparable como texto: 'YYYY-MM-DD HH:MM'. */
function claveCierre(p: Preorden): string {
  const pv = p.preventa;
  return pv?.cierra ? `${pv.cierra} ${pv.horaCierre ?? '24:00'}` : '9999';
}

export interface AvisoPreventa {
  preorden: Preorden;
  info: InfoPreventa;
}

/** Deseos cuya preventa cierra dentro de DIAS_AVISO días (y no han cerrado), el cierre más próximo primero. */
export function avisosPreventa(preordenes: Preorden[], ahora: Date): AvisoPreventa[] {
  return preordenes
    .map((preorden) => ({ preorden, info: infoPreventa(preorden, ahora) }))
    .filter((a) => a.info.fase === 'abierta' && a.info.urgencia !== 'ninguna')
    .sort((a, b) => claveCierre(a.preorden).localeCompare(claveCierre(b.preorden)));
}

/**
 * Lo que hay que pagar en el momento de apartar: todo si es pago completo, nada si es al envío,
 * y el depósito anotado si es depósito + saldo (null si no se anotó).
 */
export function montoParaApartar(p: Preorden): number | null {
  if (p.tipoPago === 'completo') return costoTotal(p);
  if (p.tipoPago === 'al_envio') return 0;
  return p.depositoEstimado ?? null;
}

/** Suma de lo que se necesita para apartar varios deseos, y cuántos no tienen el monto anotado. */
export function totalParaApartar(lista: Preorden[]): { total: number; sinMonto: number } {
  let total = 0;
  let sinMonto = 0;
  for (const p of lista) {
    const monto = montoParaApartar(p);
    if (monto === null) sinMonto += 1;
    else total += monto;
  }
  return { total, sinMonto };
}

export interface DeseosOrdenados {
  /** Los que todavía se pueden apartar: primero los que cierran antes, luego los que aún no abren, luego el resto. */
  vigentes: Preorden[];
  /** Los que ya cerraron, el más reciente primero. */
  cerrados: Preorden[];
}

export function ordenarDeseos(deseos: Preorden[], ahora: Date): DeseosOrdenados {
  const conInfo = deseos.map((p) => ({ p, info: infoPreventa(p, ahora) }));
  const grupo = ({ p, info }: (typeof conInfo)[number]) =>
    info.fase === 'abierta' && p.preventa?.cierra ? 0 : info.fase === 'proximamente' ? 1 : 2;
  const vigentes = conInfo
    .filter((x) => x.info.fase !== 'cerrada')
    .sort((a, b) => {
      const ga = grupo(a);
      const gb = grupo(b);
      if (ga !== gb) return ga - gb;
      if (ga === 0) return claveCierre(a.p).localeCompare(claveCierre(b.p));
      if (ga === 1) return (a.p.preventa?.abre ?? '').localeCompare(b.p.preventa?.abre ?? '');
      return b.p.creadaEl.localeCompare(a.p.creadaEl);
    })
    .map((x) => x.p);
  const cerrados = conInfo
    .filter((x) => x.info.fase === 'cerrada')
    .map((x) => x.p)
    .sort((a, b) => claveCierre(b).localeCompare(claveCierre(a)));
  return { vigentes, cerrados };
}

/** '23:00' → "11:00 p. m." */
export function formatearHora(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const sufijo = h < 12 ? 'a. m.' : 'p. m.';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${dos(m)} ${sufijo}`;
}

/** '2026-11-20' → "20 nov" (con el año solo si no es el de `hoy`). */
export function formatearDiaCorto(iso: string, hoy: string): string {
  const d = desdeISO(iso);
  const base = `${d.getDate()} ${MESES[d.getMonth()]}`;
  return iso.slice(0, 4) === hoy.slice(0, 4) ? base : `${base} ${d.getFullYear()}`;
}

/** Cuenta regresiva para el aviso: "Cierra hoy a las 11:00 p. m." · "Cierra mañana" · "Cierra en 5 días". */
export function textoCuentaRegresiva(p: Preorden, info: InfoPreventa, hoy: string): string {
  const pv = p.preventa;
  if (info.fase === 'cerrada') return pv?.cierra ? `Cerró el ${formatearDiaCorto(pv.cierra, hoy)}` : 'Preventa cerrada';
  if (info.fase === 'proximamente') return pv?.abre ? `Abre el ${formatearDiaCorto(pv.abre, hoy)}` : 'Todavía no abre';
  if (info.diasParaCierre === null || !pv?.cierra) return 'Preventa abierta';
  const hora = pv.horaCierre ? ` a las ${formatearHora(pv.horaCierre)}` : '';
  if (info.diasParaCierre <= 0) return `Cierra hoy${hora}`;
  if (info.diasParaCierre === 1) return `Cierra mañana${hora}`;
  if (info.diasParaCierre <= DIAS_AVISO) return `Cierra en ${info.diasParaCierre} días`;
  return `Cierra el ${formatearDiaCorto(pv.cierra, hoy)}`;
}

/** Versión corta para la etiqueta sobre la foto de la tarjeta de Deseos. null = sin etiqueta. */
export function etiquetaPreventa(p: Preorden, info: InfoPreventa, hoy: string): string | null {
  const pv = p.preventa;
  if (info.fase === 'sin_fechas') return null;
  if (info.fase === 'cerrada') return 'Cerrada';
  if (info.fase === 'proximamente') return pv?.abre ? `Abre ${formatearDiaCorto(pv.abre, hoy)}` : null;
  if (info.diasParaCierre === null || !pv?.cierra) return 'Abierta';
  if (info.diasParaCierre <= 0) return 'Cierra hoy';
  if (info.diasParaCierre === 1) return 'Cierra mañana';
  if (info.diasParaCierre <= DIAS_AVISO) return `Cierra en ${info.diasParaCierre} días`;
  return `Cierra ${formatearDiaCorto(pv.cierra, hoy)}`;
}

/**
 * Valida y arma la preventa desde los campos de texto del formulario.
 * Devuelve `preventa: undefined` si todo está vacío (el deseo no tiene preventa).
 */
export function preventaDeCampos(
  abre: string,
  cierra: string,
  hora: string,
): { ok: true; preventa: Preventa | undefined } | { ok: false; error: string } {
  const fecha = /^\d{4}-\d{2}-\d{2}$/;
  const a = abre.trim();
  const c = cierra.trim();
  const h = hora.trim();
  if (!a && !c && !h) return { ok: true, preventa: undefined };
  if (a && !fecha.test(a)) return { ok: false, error: 'La fecha en que abre no es válida.' };
  if (c && !fecha.test(c)) return { ok: false, error: 'La fecha de cierre no es válida.' };
  if (h && !/^([01]\d|2[0-3]):[0-5]\d$/.test(h)) return { ok: false, error: 'La hora de cierre no es válida.' };
  if (h && !c) return { ok: false, error: 'Elegí también el día en que cierra.' };
  if (a && c && c < a) return { ok: false, error: 'La preventa no puede cerrar antes de abrir.' };
  return { ok: true, preventa: { abre: a || null, cierra: c || null, horaCierre: h || null } };
}
