import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  titulo: string;
  subtitulo?: ReactNode;
  onCerrar: () => void;
  children: ReactNode;
}

/**
 * Hoja que sube desde abajo, dentro de la tarjeta de la app (especificación 7:
 * registrar pago, cambiar fecha y cambiar estado no son rutas).
 * Se cierra tocando el fondo o con Escape. Se monta solo mientras está abierta.
 */
export function HojaInferior({ titulo, subtitulo, onCerrar, children }: Props) {
  const hoja = useRef<HTMLDivElement>(null);
  const idTitulo = useId();

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    // preventScroll: sin él, el navegador desplaza la pantalla de atrás para "mostrar" la hoja y todo brinca.
    hoja.current?.focus({ preventScroll: true });
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Con dos hojas abiertas (ej. un menú desplegable dentro de otra hoja), Escape cierra solo la de arriba.
      const abiertas = document.querySelectorAll('[role="dialog"]');
      if (abiertas[abiertas.length - 1] === hoja.current) onCerrar();
    };
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      anterior?.focus?.({ preventScroll: true });
    };
  }, [onCerrar]);

  const contenido = (
    <div className="absolute inset-0 z-30 flex flex-col justify-end">
      <div
        aria-hidden="true"
        onClick={onCerrar}
        className="absolute inset-0 animate-[aparecer_150ms_ease-out] bg-velo"
      />
      <div
        ref={hoja}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        className="no-scrollbar relative flex max-h-[88%] animate-[subir_220ms_ease-out] flex-col gap-4 overflow-y-auto rounded-t-[28px] border border-b-0 border-borde bg-fondo px-5 shadow-[0_-12px_32px_-12px_rgba(0,0,0,0.45)] pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] focus:outline-none"
      >
        <span aria-hidden="true" className="mx-auto h-[5px] w-11 shrink-0 rounded-full bg-borde" />
        <div className="flex flex-col gap-0.5">
          <h2 id={idTitulo} className="text-[22px] font-bold">
            {titulo}
          </h2>
          {subtitulo && <p className="text-sm text-tinta-suave">{subtitulo}</p>}
        </div>
        {children}
      </div>
    </div>
  );

  // Se monta dentro de la tarjeta de la app (MarcoApp, id="marco") para cubrirla entera
  // aunque quien la abra esté dentro de un elemento con posición o scroll propio.
  const marco = typeof document !== 'undefined' ? document.getElementById('marco') : null;
  return marco ? createPortal(contenido, marco) : contenido;
}
