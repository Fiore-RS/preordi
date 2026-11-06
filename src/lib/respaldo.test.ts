import { strToU8, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import type { DatosPreordi, Preorden } from '../types';
import { desempacar, empacar, nombreRespaldo, resumir } from './respaldo';

function p(id: string, estado: Preorden['estado'], imagenId: string | null): Preorden {
  return {
    id, nombre: id, categoriaId: 'figura', tiendaId: null, estado, tipoPago: 'deposito', precio: 1000,
    costosExtra: [], pagos: [], fechaEstimada: null, historialFechas: [], fechaApartada: null,
    fechaEnviada: null, fechaRecibida: null, fechaCancelada: null, imagenId,
    creadaEl: '2026-01-01T00:00:00.000Z', actualizadaEl: '2026-01-01T00:00:00.000Z',
  };
}

const datos: DatosPreordi = {
  schemaVersion: 1,
  preordenes: [p('a', 'apartada', 'img-a'), p('b', 'deseada', null), p('c', 'recibida', 'img-c')],
  categorias: [{ id: 'figura', nombre: 'Figura', orden: 0 }],
  tiendas: [{ id: 'local', nombre: 'Tienda local' }],
};

const img = (n: number) => ({ bytes: new Uint8Array([n, n, n]), tipo: 'image/webp' });

describe('respaldo', () => {
  it('nombre con la fecha', () => {
    expect(nombreRespaldo('2026-11-05')).toBe('preordi-respaldo-2026-11-05.zip');
  });

  it('ida y vuelta: datos e imágenes quedan iguales', () => {
    const zip = empacar(datos, new Map([['img-a', img(1)], ['img-c', { bytes: new Uint8Array([9]), tipo: 'image/jpeg' }]]));
    const leido = desempacar(zip);
    expect(leido.datos).toEqual(datos);
    expect([...leido.imagenes.keys()].sort()).toEqual(['img-a', 'img-c']);
    expect(leido.imagenes.get('img-c')).toEqual({ bytes: new Uint8Array([9]), tipo: 'image/jpeg' });
  });

  it('si falta una imagen, la preorden queda sin imagen; las sobrantes se ignoran', () => {
    const zip = empacar(datos, new Map([['img-a', img(1)], ['suelta', img(2)]]));
    const leido = desempacar(zip);
    expect(leido.datos.preordenes.find((x) => x.id === 'c')?.imagenId).toBeNull();
    expect([...leido.imagenes.keys()]).toEqual(['img-a']);
    expect(resumir(leido.datos, leido.imagenes.size)).toEqual({ preordenes: 2, deseos: 1, imagenes: 1, categorias: 1, tiendas: 1 });
  });

  it('rechaza archivos que no son respaldos', () => {
    expect(() => desempacar(new Uint8Array([1, 2, 3]))).toThrow(/no es un .zip/);
    expect(() => desempacar(zipSync({ 'otro.txt': strToU8('hola') }))).toThrow(/datos.json/);
    expect(() => desempacar(zipSync({ 'datos.json': strToU8('{roto') }))).toThrow(/dañado/);
    expect(() => desempacar(zipSync({ 'datos.json': strToU8(JSON.stringify({ ...datos, schemaVersion: 9 })) }))).toThrow(/formato/);
    const huerfana = { ...datos, preordenes: [{ ...p('x', 'apartada', null), categoriaId: 'no-existe' }] };
    expect(() => desempacar(zipSync({ 'datos.json': strToU8(JSON.stringify(huerfana)) }))).toThrow(/formato/);
  });
});
