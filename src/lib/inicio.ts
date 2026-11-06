// Resumen de la pantalla de Inicio — especificación 8.1.

import type { Preorden } from '../types';
import { esActiva, recibidaConSaldo, saldoPendiente, vencida } from './calculos';
import { compararFechasEstimadas, finDePeriodo } from './fechas';

export interface ResumenInicio {
  apartadas: number;
  enCamino: number;
  deseos: number;
  /** Activas cuya fecha estimada ya pasó (las más atrasadas primero). */
  vencidas: Preorden[];
  recibidasConSaldo: Preorden[];
  /** Las llegadas más próximas (activas no vencidas, por fecha). Van en tarjetas grandes. */
  destacadas: Preorden[];
  /** Las siguientes llegadas (sin fecha al final). Van en filas debajo. */
  masAdelante: Preorden[];
  /** Cuántas llegadas hay en total, para "Ver todas". */
  totalProximas: number;
  /** Activas con saldo que no salen en "llegan pronto" (incluye las vencidas), de mayor a menor saldo. */
  porPagar: Preorden[];
}

export function resumenInicio(
  preordenes: Preorden[],
  hoy: string,
  cantidadDestacadas = 5,
  cantidadMasAdelante = 5,
  cantidadPorPagar = 4,
): ResumenInicio {
  const porFecha = (a: Preorden, b: Preorden) => compararFechasEstimadas(a.fechaEstimada, b.fechaEstimada);
  const activas = preordenes.filter(esActiva).sort(porFecha);
  const proximas = activas.filter((p) => !vencida(p, hoy));
  const destacadas = proximas.slice(0, cantidadDestacadas);
  const masAdelante = proximas.slice(cantidadDestacadas, cantidadDestacadas + cantidadMasAdelante);
  const mostradas = new Set([...destacadas, ...masAdelante].map((p) => p.id));
  return {
    apartadas: preordenes.filter((p) => p.estado === 'apartada').length,
    enCamino: preordenes.filter((p) => p.estado === 'en_camino').length,
    deseos: preordenes.filter((p) => p.estado === 'deseada').length,
    vencidas: activas.filter((p) => vencida(p, hoy)),
    recibidasConSaldo: preordenes.filter(recibidaConSaldo),
    destacadas,
    masAdelante,
    totalProximas: proximas.length,
    porPagar: activas
      .filter((p) => !mostradas.has(p.id) && saldoPendiente(p) > 0)
      .sort((a, b) => saldoPendiente(b) - saldoPendiente(a))
      .slice(0, cantidadPorPagar),
  };
}

export interface SaldoDelMes {
  /** "2026-11", o "sin_fecha" para las que no tienen fecha estimada. */
  clave: string;
  saldo: number;
  cantidad: number;
}

/**
 * Lo que falta pagar repartido por el mes en que llega cada preorden (cuando se paga el resto).
 * Solo meses con algo por pagar. Lo atrasado (vencidas y recibidas con saldo) cuenta en el mes de hoy;
 * lo que no tiene fecha va al final, en "sin_fecha".
 */
export function saldoPorMes(preordenes: Preorden[], hoy: string): SaldoDelMes[] {
  const mesHoy = hoy.slice(0, 7);
  const grupos = new Map<string, SaldoDelMes>();
  for (const p of preordenes) {
    if (!esActiva(p) && p.estado !== 'recibida') continue;
    const saldo = saldoPendiente(p);
    if (saldo <= 0) continue;
    let clave = 'sin_fecha';
    if (p.estado === 'recibida') clave = mesHoy;
    else if (p.fechaEstimada) {
      const mes = finDePeriodo(p.fechaEstimada).slice(0, 7);
      clave = mes < mesHoy ? mesHoy : mes;
    }
    const g = grupos.get(clave) ?? { clave, saldo: 0, cantidad: 0 };
    g.saldo += saldo;
    g.cantidad += 1;
    grupos.set(clave, g);
  }
  return [...grupos.values()].sort((a, b) =>
    a.clave === 'sin_fecha' ? 1 : b.clave === 'sin_fecha' ? -1 : a.clave.localeCompare(b.clave),
  );
}
