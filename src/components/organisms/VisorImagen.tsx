import { useEffect, useRef } from 'react';
import { Icono } from '../atoms/Icono';

interface Props {
  url: string;
  alt: string;
  onCerrar: () => void;
}

/** La imagen completa sobre fondo oscuro (especificación 8.4: "toque para verla completa"). */
export function VisorImagen({ url, alt, onCerrar }: Props) {
  const cerrarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    cerrarRef.current?.focus();
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
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onCerrar}
      className="absolute inset-0 z-40 flex animate-[aparecer_150ms_ease-out] items-center justify-center bg-black/90 p-4"
    >
      <img src={url} alt={alt} className="max-h-full max-w-full rounded-lg object-contain" />
      <button
        ref={cerrarRef}
        type="button"
        aria-label="Cerrar imagen"
        onClick={onCerrar}
        className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full bg-white/15 text-white"
      >
        <Icono nombre="cerrar" tamano={22} grosor={2} />
      </button>
    </div>
  );
}
