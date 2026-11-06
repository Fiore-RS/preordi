import { useId } from 'react';
import { Icono } from '../atoms/Icono';
import { MensajeError } from './Campo';

interface Props {
  /** Vista previa de la imagen actual (guardada o recién elegida), o null si no hay. */
  url: string | null;
  procesando: boolean;
  error: string | null;
  onElegir: (archivo: File) => void;
  onQuitar: () => void;
}

/**
 * Elegir, cambiar o quitar la imagen de una preorden (especificación 8.5, paso 1).
 * El <input type="file"> abre la galería o la cámara del teléfono.
 */
export function SelectorImagen({ url, procesando, error, onElegir, onQuitar }: Props) {
  const id = useId();

  const entrada = (
    <input
      id={id}
      type="file"
      accept="image/*"
      className="sr-only"
      onChange={(e) => {
        const archivo = e.target.files?.[0];
        if (archivo) onElegir(archivo);
        e.target.value = ''; // permite volver a elegir el mismo archivo
      }}
    />
  );

  if (url) {
    return (
      <div className="flex flex-col gap-2">
        <img src={url} alt="Imagen de la preorden" className="aspect-[4/3] w-full rounded-[18px] object-cover" />
        <div className="flex gap-2">
          <label
            htmlFor={id}
            className="flex min-h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border-[1.5px] border-tinta text-sm font-bold focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-naranja-500"
          >
            {entrada}
            <Icono nombre="imagen" tamano={18} />
            {procesando ? 'Procesando…' : 'Cambiar'}
          </label>
          <button
            type="button"
            onClick={onQuitar}
            className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full border border-borde text-sm font-medium text-tinta-suave hover:bg-superficie-suave"
          >
            <Icono nombre="basura" tamano={18} />
            Quitar
          </button>
        </div>
        <MensajeError id={`${id}-error`} texto={error ?? undefined} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="flex h-[150px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[18px] border-2 border-dashed border-acento-borde bg-acento-tenue text-sm font-bold text-acento-texto focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-naranja-500"
      >
        {entrada}
        <Icono nombre="imagen" tamano={30} grosor={1.6} />
        {procesando ? 'Procesando…' : 'Agregar imagen'}
      </label>
      <MensajeError id={`${id}-error`} texto={error ?? undefined} />
    </div>
  );
}
