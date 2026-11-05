import { useEffect, useRef, type ReactNode } from 'react';

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

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    hoja.current?.focus();
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      anterior?.focus?.();
    };
  }, [onCerrar]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end">
      <div
        aria-hidden="true"
        onClick={onCerrar}
        className="absolute inset-0 animate-[aparecer_150ms_ease-out] bg-marino-900/55"
      />
      <div
        ref={hoja}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hoja-titulo"
        tabIndex={-1}
        className="no-scrollbar relative flex max-h-[88%] animate-[subir_220ms_ease-out] flex-col gap-4 overflow-y-auto rounded-t-[28px] bg-papel px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] focus:outline-none"
      >
        <span aria-hidden="true" className="mx-auto h-[5px] w-11 shrink-0 rounded-full bg-marino-100" />
        <div className="flex flex-col gap-0.5">
          <h2 id="hoja-titulo" className="text-[22px] font-bold">
            {titulo}
          </h2>
          {subtitulo && <p className="text-sm text-marino-400">{subtitulo}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
