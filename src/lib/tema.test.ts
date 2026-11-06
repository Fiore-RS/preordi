import { describe, expect, it } from 'vitest';
import { esOscuro } from './tema';

describe('tema', () => {
  it('Sistema sigue al teléfono; Claro y Oscuro mandan siempre', () => {
    expect(esOscuro('sistema', true)).toBe(true);
    expect(esOscuro('sistema', false)).toBe(false);
    expect(esOscuro('oscuro', false)).toBe(true);
    expect(esOscuro('claro', true)).toBe(false);
  });
});
