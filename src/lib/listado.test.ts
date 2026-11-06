import { describe, expect, it } from 'vitest';
import type { Preorden } from '../types';
import { FILTROS_POR_DEFECTO, filtrarYOrdenar, filtrosAURL, filtrosDesdeURL } from './listado';

function p(id: string, cambios: Partial<Preorden>): Preorden {
  return {
    id,
    nombre: id,
    categoriaId: 'figura',
    tiendaId: 'local',
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

const lista = [
  p('Peluche', { fechaEstimada: { fecha: '2026-10-01', precision: 'mes' }, precio: 18000, creadaEl: '2026-09-01T00:00:00.000Z' }),
  p('Artbook', { estado: 'en_camino', tiendaId: 'amazon', fechaEstimada: { fecha: '2026-11-10', precision: 'dia' }, precio: 24500 }),
  p('figura', { fechaEstimada: { fecha: '2027-01-01', precision: 'mes' }, precio: 51500, creadaEl: '2026-10-01T00:00:00.000Z' }),
  p('Tomo 12', { categoriaId: 'manga', tiendaId: 'amazon', precio: 9800 }),
  p('Novela', { estado: 'recibida', categoriaId: 'libro' }),
  p('Póster', { estado: 'cancelada', categoriaId: 'merch' }),
  p('Deseo', { estado: 'deseada' }),
];

const nombres = (xs: Preorden[]) => xs.map((x) => x.nombre);

describe('filtrar', () => {
  it('Activas: apartadas y en camino, por fecha y sin fecha al final', () => {
    expect(nombres(filtrarYOrdenar(lista, FILTROS_POR_DEFECTO))).toEqual(['Peluche', 'Artbook', 'figura', 'Tomo 12']);
  });

  it('Todas incluye recibidas y canceladas, pero nunca deseos', () => {
    const r = nombres(filtrarYOrdenar(lista, { ...FILTROS_POR_DEFECTO, estado: 'todas' }));
    expect(r).toHaveLength(6);
    expect(r).not.toContain('Deseo');
  });

  it('por estado, categoría y tienda', () => {
    expect(nombres(filtrarYOrdenar(lista, { ...FILTROS_POR_DEFECTO, estado: 'en_camino' }))).toEqual(['Artbook']);
    expect(nombres(filtrarYOrdenar(lista, { ...FILTROS_POR_DEFECTO, categoriaId: 'manga' }))).toEqual(['Tomo 12']);
    expect(nombres(filtrarYOrdenar(lista, { ...FILTROS_POR_DEFECTO, tiendaId: 'amazon' }))).toEqual(['Artbook', 'Tomo 12']);
  });
});

describe('ordenar', () => {
  it('saldo mayor, nombre (sin importar mayúsculas) y más recientes', () => {
    expect(nombres(filtrarYOrdenar(lista, { ...FILTROS_POR_DEFECTO, orden: 'saldo' }))).toEqual(['figura', 'Artbook', 'Peluche', 'Tomo 12']);
    expect(nombres(filtrarYOrdenar(lista, { ...FILTROS_POR_DEFECTO, orden: 'nombre' }))).toEqual(['Artbook', 'figura', 'Peluche', 'Tomo 12']);
    expect(nombres(filtrarYOrdenar(lista, { ...FILTROS_POR_DEFECTO, orden: 'recientes' }))[0]).toBe('figura');
  });

  it('no modifica la lista original', () => {
    const copia = [...lista];
    filtrarYOrdenar(lista, { ...FILTROS_POR_DEFECTO, orden: 'nombre' });
    expect(lista).toEqual(copia);
  });
});

describe('filtros en la URL', () => {
  it('ida y vuelta, y valores inválidos caen al valor por defecto', () => {
    const f = { estado: 'en_camino', categoriaId: 'manga', tiendaId: null, orden: 'saldo' } as const;
    expect(filtrosDesdeURL(filtrosAURL(f))).toEqual(f);
    expect(filtrosAURL(FILTROS_POR_DEFECTO).toString()).toBe('');
    expect(filtrosDesdeURL(new URLSearchParams('estado=deseada&orden=x'))).toEqual(FILTROS_POR_DEFECTO);
  });
});
