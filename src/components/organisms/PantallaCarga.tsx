import { useEffect, useState } from 'react';

const DURACION = 2000;
const DESVANECER = 250;

/**
 * Pantalla de carga (especificación 8.10): el ícono pulsando sobre marino, encima de todo,
 * mientras la app se monta debajo. Colores de marca fijos (igual en claro y oscuro) y el mismo
 * dibujo que los splash de iOS de public/splash/, así el paso de uno a otro no se nota.
 */
export function PantallaCarga() {
  const [fase, setFase] = useState<'visible' | 'saliendo' | 'fuera'>('visible');

  useEffect(() => {
    const salir = window.setTimeout(() => setFase('saliendo'), DURACION);
    const quitar = window.setTimeout(() => setFase('fuera'), DURACION + DESVANECER);
    return () => {
      window.clearTimeout(salir);
      window.clearTimeout(quitar);
    };
  }, []);

  if (fase === 'fuera') return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-marino-500 transition-opacity duration-250 ${
        fase === 'saliendo' ? 'opacity-0' : ''
      }`}
    >
      <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="size-32 animate-pulse" />
    </div>
  );
}
