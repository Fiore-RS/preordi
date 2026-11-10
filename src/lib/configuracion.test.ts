import { describe, expect, it } from 'vitest';
import type { Categoria, Preorden } from '../types';
import { contarUso, moverA, moverCategoria, renumerar, reasignarCategoria, reasignarTienda, validarNombre } from './configuracion';

const categorias: Categoria[] = [
  { id: 'libro', nombre: 'Libro', orden: 0 },
  { id: 'manga', nombre: 'Manga', orden: 1 },
  { id: 'figura', nombre: 'Figura', orden: 2 },
];

function p(id: string, categoriaId: string, tiendaId: string | null): Preorden {
  return {
    id, nombre: id, categoriaId, tiendaId, estado: 'apartada', tipoPago: 'deposito', precio: 1000,
    costosExtra: [], pagos: [], fechaEstimada: null, historialFechas: [], fechaApartada: null,
    fechaEnviada: null, fechaRecibida: null, fechaCancelada: null, imagenId: null,
    creadaEl: '2026-01-01T00:00:00.000Z', actualizadaEl: '2026-01-01T00:00:00.000Z',
  };
}

const preordenes = [p('a', 'figura', 'local'), p('b', 'figura', null), p('c', 'manga', 'local')];

describe('nombres', () => {
  it('obligatorio y sin repetir, sin importar mayúsculas ni tildes', () => {
    expect(validarNombre('  ', categorias)).toMatch(/Escribí/);
    expect(validarNombre('figura', categorias)).toMatch(/Ya existe/);
    expect(validarNombre('Líbro', categorias)).toMatch(/Ya existe/);
    expect(validarNombre('Artbook', categorias)).toBeNull();
    expect(validarNombre('Figura', categorias, 'figura')).toBeNull();
  });
});

describe('uso', () => {
  it('cuenta preórdenes por categoría y por tienda', () => {
    const uso = contarUso(preordenes);
    expect(uso.categorias.get('figura')).toBe(2);
    expect(uso.categorias.get('libro')).toBeUndefined();
    expect(uso.tiendas.get('local')).toBe(2);
  });
});

describe('orden de categorías', () => {
  it('sube y baja, y renumera', () => {
    expect(moverCategoria(categorias, 'figura', -1).map((c) => [c.id, c.orden])).toEqual([
      ['libro', 0], ['figura', 1], ['manga', 2],
    ]);
    expect(moverCategoria(categorias, 'libro', -1)).toBe(categorias);
    expect(moverCategoria(categorias, 'figura', 1)).toBe(categorias);
  });
});

describe('reasignar antes de borrar', () => {
  it('mueve las preórdenes de categoría y de tienda', () => {
    const ahora = '2026-11-05T00:00:00.000Z';
    expect(reasignarCategoria(preordenes, 'figura', 'libro', ahora).map((x) => x.categoriaId)).toEqual(['libro', 'libro', 'manga']);
    expect(reasignarTienda(preordenes, 'local', null, ahora).map((x) => x.tiendaId)).toEqual([null, null, null]);
  });
});

describe('moverA y renumerar (arrastrar para ordenar)', () => {
  it('mueve hacia abajo y hacia arriba', () => {
    expect(moverA(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(moverA(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });
  it('devuelve la misma lista si no hay cambio o el índice no existe', () => {
    const lista = ['a', 'b'];
    expect(moverA(lista, 1, 1)).toBe(lista);
    expect(moverA(lista, 0, 5)).toBe(lista);
  });
  it('renumera el orden según la posición', () => {
    const r = renumerar([
      { id: 'x', nombre: 'X', orden: 4 },
      { id: 'y', nombre: 'Y', orden: 1 },
    ]);
    expect(r.map((c) => c.orden)).toEqual([0, 1]);
  });
});
