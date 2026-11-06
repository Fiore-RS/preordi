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
  p('Figura', { fechaEstimada: { fecha: '2027-03-01', precision: 'mes' } }),
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

  it('las más próximas en grande y las siguientes en filas (sin fecha al final)', () => {
    expect(nombres(r.destacadas)).toEqual(['Artbook', 'Tomo 12', 'Figura', 'Sin fecha']);
    expect(r.masAdelante).toEqual([]);
    expect(r.totalProximas).toBe(4);
    const chico = resumenInicio(lista, HOY, 1, 2);
    expect(nombres(chico.destacadas)).toEqual(['Artbook']);
    expect(nombres(chico.masAdelante)).toEqual(['Tomo 12', 'Figura']);
  });

  it('por pagar: lo que no sale en "llegan pronto", de mayor a menor saldo', () => {
    expect(nombres(r.porPagar)).toEqual(['Llavero', 'Peluche']);
    const corto = resumenInicio(
      lista.map((x) => (x.nombre === 'Figura' ? { ...x, precio: 50000 } : x)),
      HOY,
      2,
      0,
    );
    expect(nombres(corto.porPagar)).toEqual(['Figura', 'Llavero', 'Peluche', 'Sin fecha']);
  });

  it('recibidas con saldo pendiente', () => {
    expect(nombres(r.recibidasConSaldo)).toEqual(['Novela']);
  });
});
