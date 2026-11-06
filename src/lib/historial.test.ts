import { describe, expect, it } from 'vitest';
import type { Preorden } from '../types';
import { aniosDisponibles, resumenHistorial } from './historial';

function p(nombre: string, cambios: Partial<Preorden>): Preorden {
  return {
    id: nombre,
    nombre,
    categoriaId: 'figura',
    tiendaId: null,
    estado: 'recibida',
    tipoPago: 'completo',
    precio: 10000,
    costosExtra: [],
    pagos: [],
    fechaEstimada: null,
    historialFechas: [],
    fechaApartada: '2026-01-01',
    fechaEnviada: null,
    fechaRecibida: null,
    fechaCancelada: null,
    imagenId: null,
    creadaEl: '2026-01-01T00:00:00.000Z',
    actualizadaEl: '2026-01-01T00:00:00.000Z',
    ...cambios,
  };
}

const pago = (monto: number, tipo: 'saldo' | 'reembolso' = 'saldo') => ({ id: `${tipo}${monto}`, fecha: '2026-01-01', monto, tipo });

const lista = [
  p('Tomo 11', { categoriaId: 'manga', fechaRecibida: '2026-09-12', pagos: [pago(9500)] }),
  p('Figura mini', { fechaRecibida: '2026-08-20', pagos: [pago(22000)] }),
  p('Novela', { categoriaId: 'libro', fechaRecibida: '2026-06-03', pagos: [pago(14500)] }),
  p('Póster', { categoriaId: 'merch', fechaRecibida: '2026-03-18', pagos: [pago(8000)] }),
  p('Figura vieja', { fechaRecibida: '2025-12-01', pagos: [pago(30000)] }),
  p('Cancelada con pérdida', { estado: 'cancelada', fechaCancelada: '2026-05-01', pagos: [pago(10000), pago(4000, 'reembolso')] }),
  p('Cancelada reembolsada', { estado: 'cancelada', fechaCancelada: '2026-07-01', pagos: [pago(5000), pago(5000, 'reembolso')] }),
  p('Activa', { estado: 'apartada' }),
];

describe('historial', () => {
  it('años disponibles por pestaña', () => {
    expect(aniosDisponibles(lista, 'recibidas')).toEqual([2026, 2025]);
    expect(aniosDisponibles(lista, 'canceladas')).toEqual([2026]);
  });

  it('recibidas del año: total, orden y desglose por categoría', () => {
    const r = resumenHistorial(lista, 'recibidas', 2026);
    expect(r.items.map((x) => x.nombre)).toEqual(['Tomo 11', 'Figura mini', 'Novela', 'Póster']);
    expect(r.total).toBe(54000);
    expect(r.porCategoria).toEqual([
      { categoriaId: 'figura', monto: 22000 },
      { categoriaId: 'libro', monto: 14500 },
      { categoriaId: 'manga', monto: 9500 },
      { categoriaId: 'merch', monto: 8000 },
    ]);
  });

  it('canceladas: suma solo lo que no se reembolsó', () => {
    const r = resumenHistorial(lista, 'canceladas', 2026);
    expect(r.items.map((x) => x.nombre)).toEqual(['Cancelada reembolsada', 'Cancelada con pérdida']);
    expect(r.total).toBe(6000);
    expect(r.porCategoria).toEqual([]);
  });
});
