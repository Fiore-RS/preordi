import { describe, expect, it } from 'vitest';
import type { Preorden } from '../types';
import { resumenInicio } from './inicio';

function p(nombre: string, cambios: Partial<Preorden>): Preorden {
  return {
    id: nombre,
    nombre,
    categoriaId: 'c',
    tiendaId: null,
    estado: 'apartada',
    tipoPago: 'deposito',
    precio: 10000,
    costosExtra: [],
    pagos: [],
    fechaEstimada: null,
    historialFechas: [],
    fechaApartada: '2026-08-01',
    fechaEnviada: null,
    fechaRecibida: null,
    fechaCancelada: null,
    imagenId: null,
    creadaEl: '2026-08-01T00:00:00.000Z',
    actualizadaEl: '2026-08-01T00:00:00.000Z',
    ...cambios,
  };
}

const HOY = '2026-11-05';
const lista = [
  p('Peluche', { fechaEstimada: { fecha: '2026-10-01', precision: 'mes' } }),
  p('Llavero', { fechaEstimada: { fecha: '2026-09-15', precision: 'dia' } }),
  p('Artbook', { estado: 'en_camino', fechaEstimada: { fecha: '2026-11-10', precision: 'dia' } }),
  p('Tomo 12', { fechaEstimada: { fecha: '2026-11-14', precision: 'dia' } }),
  p('Sin fecha', {}),
  p('Figura', { fechaEstimada: { fecha: '2027-01-01', precision: 'trimestre' } }),
  p('Novela', { estado: 'recibida', fechaRecibida: '2026-10-01' }),
  p('Póster', { estado: 'recibida', fechaRecibida: '2026-10-01', pagos: [{ id: 'x', fecha: '2026-10-01', monto: 10000, tipo: 'saldo' }] }),
  p('Box set', { estado: 'deseada' }),
  p('Cancelada', { estado: 'cancelada' }),
];

describe('resumen de Inicio', () => {
  const r = resumenInicio(lista, HOY);
  const nombres = (xs: Preorden[]) => xs.map((x) => x.nombre);

  it('cuenta por estado', () => {
    expect([r.apartadas, r.enCamino, r.deseos]).toEqual([5, 1, 1]);
  });

  it('separa las vencidas, de la más atrasada a la menos', () => {
    expect(nombres(r.vencidas)).toEqual(['Llavero', 'Peluche']);
  });

  it('próximas llegadas sin las vencidas y sin fecha al final', () => {
    expect(nombres(r.proximas)).toEqual(['Artbook', 'Tomo 12', 'Figura', 'Sin fecha']);
    expect(resumenInicio(lista, HOY, 2).proximas).toHaveLength(2);
  });

  it('recibidas con saldo pendiente', () => {
    expect(nombres(r.recibidasConSaldo)).toEqual(['Novela']);
  });
});
