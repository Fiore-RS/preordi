// Modo oscuro — especificación 10.4.
// El tema vive aparte de los datos (llave propia en localStorage), así no toca el modelo.
// La misma lógica está, en corto, en el script de index.html para que no haya destello claro al abrir.

import { useEffect, useSyncExternalStore } from 'react';

export type Tema = 'sistema' | 'claro' | 'oscuro';
export const LLAVE_TEMA = 'preordi:tema';

const CONSULTA_OSCURO = '(prefers-color-scheme: dark)';
const oyentes = new Set<() => void>();

export function leerTema(): Tema {
  try {
    const t = localStorage.getItem(LLAVE_TEMA);
    return t === 'claro' || t === 'oscuro' ? t : 'sistema';
  } catch {
    return 'sistema';
  }
}

export function guardarTema(tema: Tema): void {
  try {
    if (tema === 'sistema') localStorage.removeItem(LLAVE_TEMA);
    else localStorage.setItem(LLAVE_TEMA, tema);
  } catch {
    // Sin almacenamiento (modo privado): el tema dura hasta cerrar la app.
  }
  temaActual = tema;
  oyentes.forEach((f) => f());
}

let temaActual: Tema = leerTema();

/** ¿Se ve oscuro con este tema? En "sistema" depende del teléfono. */
export function esOscuro(tema: Tema, sistemaOscuro: boolean): boolean {
  return tema === 'oscuro' || (tema === 'sistema' && sistemaOscuro);
}

/** Pone o quita .dark en <html>, avisa a los controles nativos y pinta la barra del navegador. */
function aplicar(oscuro: boolean) {
  const raiz = document.documentElement;
  raiz.classList.toggle('dark', oscuro);
  raiz.style.colorScheme = oscuro ? 'dark' : 'light';
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.append(meta);
  }
  meta.content = getComputedStyle(raiz).getPropertyValue('--color-fondo').trim() || (oscuro ? '#0D1726' : '#FFFDF8');
}

function suscribir(f: () => void) {
  oyentes.add(f);
  return () => oyentes.delete(f);
}

/** El tema elegido en Configuración, y cómo cambiarlo. */
export function useTema(): [Tema, (tema: Tema) => void] {
  const tema = useSyncExternalStore(suscribir, () => temaActual);
  return [tema, guardarTema];
}

/**
 * Aplica el tema y, en "Sistema", escucha los cambios del teléfono en tiempo real.
 * Se usa una sola vez, en App.
 */
export function useAplicarTema(): void {
  const [tema] = useTema();
  useEffect(() => {
    const consulta = window.matchMedia(CONSULTA_OSCURO);
    const actualizar = () => aplicar(esOscuro(tema, consulta.matches));
    actualizar();
    if (tema !== 'sistema') return;
    consulta.addEventListener('change', actualizar);
    return () => consulta.removeEventListener('change', actualizar);
  }, [tema]);
}
