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

const FOCO = 'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-naranja-500';

/**
 * Elegir, cambiar o quitar la imagen de una preorden (especificación 8.5, paso 1).
 * El <input type="file"> abre la galería o la cámara del teléfono.
 * En la dirección Vitrina (10.9) se ve como una tarjeta con foto: marino sin imagen,
 * con la esquina naranja de "agregar" como las tarjetas de Inicio.
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
        <img src={url} alt="Imagen de la preorden" className="aspect-[4/3] w-full rounded-[22px] object-cover" />
        <div className="flex gap-2">
          <label
            htmlFor={id}
            className={`flex min-h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-[1.5px] border-tinta text-sm font-bold ${FOCO}`}
          >
            {entrada}
            <Icono nombre="imagen" tamano={18} />
            {procesando ? 'Procesando…' : 'Cambiar'}
          </label>
          <button
            type="button"
            onClick={onQuitar}
            className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-superficie-suave text-sm font-medium text-tinta hover:bg-borde-suave"
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
        className={`relative flex h-[168px] cursor-pointer flex-col justify-end overflow-hidden rounded-[22px] bg-marino-500 p-4 pr-16 text-papel ${FOCO}`}
      >
        {entrada}
        <span className="font-display text-lg leading-tight font-bold">
          {procesando ? 'Procesando…' : 'Agregá una foto'}
        </span>
        <span
          aria-hidden="true"
          className="absolute right-0 bottom-0 flex size-12 items-center justify-center rounded-tl-[20px] bg-naranja-500 text-marino-500"
        >
          <Icono nombre="mas" tamano={24} grosor={2.4} />
        </span>
      </label>
      <MensajeError id={`${id}-error`} texto={error ?? undefined} />
    </div>
  );
}
