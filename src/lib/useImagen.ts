import { useEffect, useState } from 'react';
import type { ID } from '../types';
import { cargarUrl, urlEnCache } from './imagenes';

/**
 * URL de la imagen guardada en IndexedDB, o null mientras carga o si no hay.
 * Si ya se cargó antes (o se precargó al abrir la app), sale de una vez desde el primer render,
 * así las pantallas no muestran primero el marcador y después la foto.
 */
export function useImagen(id: ID | null): string | null {
  const [cargada, setCargada] = useState<{ id: ID; url: string } | null>(() => {
    const url = id ? urlEnCache(id) : null;
    return id && url ? { id, url } : null;
  });

  useEffect(() => {
    if (!id || urlEnCache(id)) return;
    let vigente = true;
    cargarUrl(id).then((url) => {
      if (vigente && url) setCargada({ id, url });
    });
    return () => {
      vigente = false;
    };
  }, [id]);

  if (!id) return null;
  // Evita mostrar por un instante la imagen anterior al cambiar de id.
  if (cargada?.id === id) return cargada.url;
  return urlEnCache(id);
}
