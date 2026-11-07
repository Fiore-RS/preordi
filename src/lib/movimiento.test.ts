import { describe, expect, it } from 'vitest';
import { nivelDe, transicionEntre } from './movimiento';

describe('nivelDe', () => {
  it('ubica pestañas y pantallas secundarias', () => {
    expect(nivelDe('/')).toBe(0);
    expect(nivelDe('/preordenes')).toBe(0);
    expect(nivelDe('/deseos')).toBe(0);
    expect(nivelDe('/preordenes/abc')).toBe(1);
    expect(nivelDe('/preordenes/nueva')).toBe(1);
    expect(nivelDe('/config')).toBe(1);
    expect(nivelDe('/preordenes/abc/editar')).toBe(2);
  });
});

describe('transicionEntre', () => {
  it('anima una pestaña solo la primera vez', () => {
    expect(transicionEntre(null, '/', false)).toBe('animate-entrar');
    expect(transicionEntre('/', '/deseos', false)).toBe('animate-entrar');
    expect(transicionEntre('/deseos', '/', true)).toBe('');
  });

  it('entra desde la derecha al ir más adentro', () => {
    expect(transicionEntre('/preordenes', '/preordenes/abc', false)).toBe('animate-subpantalla-entra');
    expect(transicionEntre('/preordenes/abc', '/preordenes/abc/editar', false)).toBe('animate-subpantalla-entra');
  });

  it('vuelve desde la izquierda al ir hacia afuera, aunque la pestaña sea nueva', () => {
    expect(transicionEntre('/preordenes/abc/editar', '/preordenes/abc', true)).toBe('animate-subpantalla-vuelve');
    expect(transicionEntre('/preordenes/abc', '/historial', false)).toBe('animate-subpantalla-vuelve');
  });

  it('no anima entre pantallas del mismo nivel ni al abrir directo una secundaria', () => {
    expect(transicionEntre('/preordenes/nueva', '/preordenes/abc', false)).toBe('');
    expect(transicionEntre(null, '/preordenes/abc', false)).toBe('');
    expect(transicionEntre('/', '/', true)).toBe('');
  });
});
