import { useEffect, useState } from 'react';
import type { ID } from '../types';
import { obtenerImagen } from './imagenes';

/**
 * URL temporal (object URL) de la imagen guardada en IndexedDB, o null mientras carga
 * o si no hay. Se libera sola al desmontar o al cambiar de imagen.
 */
export function useImagen(id: ID | null): string | null {
  const [cargada, setCargada] = useState<{ id: ID; url: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    let vigente = true;
    let url: string | null = null;
    obtenerImagen(id)
      .then((blob) => {
        if (!vigente || !blob) return;
        url = URL.createObjectURL(blob);
        setCargada({ id, url });
      })
      .catch(() => {
        // Sin imagen: se muestra el marcador.
      });
    return () => {
      vigente = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [id]);

  // Evita mostrar por un instante la imagen anterior al cambiar de id.
  return id && cargada?.id === id ? cargada.url : null;
}
