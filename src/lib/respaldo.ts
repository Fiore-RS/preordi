// Exportar e importar respaldo .zip — especificación 6.3.
// El .zip lleva datos.json (DatosPreordi) e imagenes/<id>.webp (o .jpg), empacados con fflate.

import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from 'fflate';
import type { DatosPreordi, ID } from '../types';
import { guardarVarias, limpiarHuerfanas, todasLasImagenes } from './imagenes';
import { migrar } from './persistencia';

export interface ResumenRespaldo {
  preordenes: number;
  deseos: number;
  imagenes: number;
  categorias: number;
  tiendas: number;
}

export interface RespaldoLeido {
  datos: DatosPreordi;
  /** Solo las imágenes que usa alguna preorden. */
  imagenes: Map<ID, Blob>;
  resumen: ResumenRespaldo;
}

const ARCHIVO_DATOS = 'datos.json';
const CARPETA_IMAGENES = 'imagenes/';

const EXTENSION: Record<string, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };
const TIPO: Record<string, string> = { webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' };

/** Nombre del archivo: preordi-respaldo-YYYY-MM-DD.zip */
export function nombreRespaldo(fecha: string): string {
  return `preordi-respaldo-${fecha}.zip`;
}

export function resumir(datos: DatosPreordi, imagenes: number): ResumenRespaldo {
  const deseos = datos.preordenes.filter((p) => p.estado === 'deseada').length;
  return {
    preordenes: datos.preordenes.length - deseos,
    deseos,
    imagenes,
    categorias: datos.categorias.length,
    tiendas: datos.tiendas.length,
  };
}

/** Arma el .zip. Las imágenes van sin volver a comprimir (WebP ya viene comprimido). */
export function empacar(datos: DatosPreordi, imagenes: Map<ID, { bytes: Uint8Array; tipo: string }>): Uint8Array {
  const archivos: Zippable = { [ARCHIVO_DATOS]: strToU8(JSON.stringify(datos, null, 2)) };
  for (const [id, { bytes, tipo }] of imagenes) {
    archivos[`${CARPETA_IMAGENES}${id}.${EXTENSION[tipo] ?? 'webp'}`] = [bytes, { level: 0 }];
  }
  return zipSync(archivos);
}

/**
 * Lee el .zip y valida su contenido, sin aplicar nada.
 * Lanza un Error con un mensaje para mostrar si el archivo no sirve.
 */
export function desempacar(zip: Uint8Array): { datos: DatosPreordi; imagenes: Map<ID, { bytes: Uint8Array; tipo: string }> } {
  let archivos: Record<string, Uint8Array>;
  try {
    archivos = unzipSync(zip);
  } catch {
    throw new Error('Ese archivo no es un .zip válido.');
  }

  const json = archivos[ARCHIVO_DATOS];
  if (!json) throw new Error('El .zip no tiene datos.json, así que no parece un respaldo de Preordi.');

  let crudo: unknown;
  try {
    crudo = JSON.parse(strFromU8(json));
  } catch {
    throw new Error('El datos.json del respaldo está dañado.');
  }
  const migrados = migrar(crudo);
  if (!migrados || !estructuraValida(migrados)) {
    throw new Error('El respaldo no tiene el formato de Preordi o es de una versión que no se reconoce.');
  }

  const encontradas = new Map<ID, { bytes: Uint8Array; tipo: string }>();
  for (const [ruta, bytes] of Object.entries(archivos)) {
    const coincide = /^imagenes\/([^/]+)\.(webp|jpe?g|png)$/i.exec(ruta);
    if (coincide && bytes.length > 0) encontradas.set(coincide[1], { bytes, tipo: TIPO[coincide[2].toLowerCase()] });
  }

  // Solo se conservan las imágenes que usa alguna preorden; si falta una, la preorden queda sin imagen.
  const imagenes = new Map<ID, { bytes: Uint8Array; tipo: string }>();
  const datos: DatosPreordi = {
    ...migrados,
    preordenes: migrados.preordenes.map((p) => {
      if (!p.imagenId) return p;
      const img = encontradas.get(p.imagenId);
      if (!img) return { ...p, imagenId: null };
      imagenes.set(p.imagenId, img);
      return p;
    }),
  };
  return { datos, imagenes };
}

function estructuraValida(d: DatosPreordi): boolean {
  const conId = (x: unknown) => !!x && typeof x === 'object' && typeof (x as { id?: unknown }).id === 'string';
  const categorias = new Set(d.categorias.map((c) => c.id));
  return (
    d.categorias.every(conId) &&
    d.tiendas.every(conId) &&
    d.preordenes.every(
      (p) =>
        conId(p) &&
        typeof p.nombre === 'string' &&
        typeof p.precio === 'number' &&
        Array.isArray(p.pagos) &&
        Array.isArray(p.costosExtra) &&
        Array.isArray(p.historialFechas) &&
        categorias.has(p.categoriaId),
    )
  );
}

/** Junta los datos con las imágenes de IndexedDB y devuelve el .zip listo para descargar. */
export async function exportarRespaldo(datos: DatosPreordi): Promise<Blob> {
  const guardadas = await todasLasImagenes();
  const imagenes = new Map<ID, { bytes: Uint8Array; tipo: string }>();
  for (const p of datos.preordenes) {
    const blob = p.imagenId ? guardadas.get(p.imagenId) : undefined;
    if (p.imagenId && blob) imagenes.set(p.imagenId, { bytes: new Uint8Array(await blob.arrayBuffer()), tipo: blob.type });
  }
  const zip = empacar(datos, imagenes);
  return new Blob([zip.buffer as ArrayBuffer], { type: 'application/zip' });
}

/** Lee el archivo elegido y devuelve datos, imágenes y resumen, sin tocar nada todavía. */
export async function leerRespaldo(archivo: File): Promise<RespaldoLeido> {
  const { datos, imagenes } = desempacar(new Uint8Array(await archivo.arrayBuffer()));
  const blobs = new Map<ID, Blob>();
  for (const [id, { bytes, tipo }] of imagenes) blobs.set(id, new Blob([bytes.slice().buffer], { type: tipo }));
  return { datos, imagenes: blobs, resumen: resumir(datos, blobs.size) };
}

/**
 * Guarda las imágenes del respaldo y borra las que ya no se usan.
 * Primero se escriben las nuevas, así que si algo falla no se pierde lo que había.
 */
export async function aplicarImagenes(respaldo: RespaldoLeido): Promise<void> {
  await guardarVarias(respaldo.imagenes);
  await limpiarHuerfanas(new Set(respaldo.imagenes.keys()));
}

/** Descarga un archivo con un enlace temporal. */
export function descargar(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
