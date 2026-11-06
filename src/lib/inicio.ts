// Resumen de la pantalla de Inicio — especificación 8.1.

import type { Preorden } from '../types';
import { esActiva, recibidaConSaldo, saldoPendiente, vencida } from './calculos';
import { compararFechasEstimadas } from './fechas';

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
