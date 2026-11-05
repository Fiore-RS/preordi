// Exportar e importar respaldo .zip — especificación 6.3.
// Fase 6: datos.json + imagenes/<id>.webp, empacados con fflate.

import type { DatosPreordi } from '../types';

export interface ResumenRespaldo {
  preordenes: number;
  imagenes: number;
}

/** Nombre del archivo: preordi-respaldo-YYYY-MM-DD.zip */
export function nombreRespaldo(fecha: string): string {
  return `preordi-respaldo-${fecha}.zip`;
}

/** TODO (fase 6): empacar datos.json y las imágenes de IndexedDB con fflate.zipSync. */
export async function exportarRespaldo(datos: DatosPreordi): Promise<Blob> {
  const json = JSON.stringify(datos, null, 2);
  throw new Error(`Exportar respaldo: pendiente (fase 6). Datos listos: ${json.length} caracteres.`);
}

/** TODO (fase 6): leer el .zip, validar con migrar() y devolver datos + resumen sin aplicarlos. */
export async function leerRespaldo(archivo: File): Promise<{ datos: DatosPreordi; resumen: ResumenRespaldo }> {
  throw new Error(`Importar respaldo: pendiente (fase 6). Archivo: ${archivo.name}`);
}
