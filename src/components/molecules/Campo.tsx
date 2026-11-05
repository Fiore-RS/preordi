import type { ReactNode } from 'react';
import { Icono } from '../atoms/Icono';

/** Estilo compartido de input, select y textarea. */
export const CLASE_ENTRADA =
  'w-full rounded-xl border border-marino-100 bg-white px-3.5 text-base text-marino-500 placeholder:text-marino-300 focus:border-marino-500 focus:outline-none aria-[invalid=true]:border-naranja-700';

export function MensajeError({ id, texto }: { id: string; texto?: string }) {
  if (!texto) return null;
  return (
    <p id={id} className="flex items-center gap-1.5 text-[13px] font-medium text-naranja-700">
      <Icono nombre="alerta" tamano={15} grosor={2} />
      {texto}
    </p>
  );
}

interface Props {
  /** Id del contenedor (para llevar el foco al primer error). */
  id: string;
  etiqueta: string;
  /** Id del control al que apunta la etiqueta. Sin él, se usa un fieldset con legend. */
  para?: string;
  error?: string;
  ayuda?: ReactNode;
  children: ReactNode;
}

/** Etiqueta + control + mensaje de error. */
export function Campo({ id, etiqueta, para, error, ayuda, children }: Props) {
  const contenido = (
    <>
      {children}
      {ayuda && !error && <p className="text-[13px] text-marino-400">{ayuda}</p>}
      <MensajeError id={`${id}-error`} texto={error} />
    </>
  );

  if (para) {
    return (
      <div id={id} className="flex flex-col gap-1.5">
        <label htmlFor={para} className="text-sm font-bold">
          {etiqueta}
        </label>
        {contenido}
      </div>
    );
  }
  return (
    <fieldset id={id} className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 text-sm font-bold">{etiqueta}</legend>
      {contenido}
    </fieldset>
  );
}
