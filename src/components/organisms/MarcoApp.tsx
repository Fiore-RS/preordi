import type { ReactNode } from 'react';

/**
 * Marco fijo al viewport (fixed inset-0), igual que en Sobres: el documento nunca
 * hace scroll por su cuenta; todo el scroll queda dentro de esta tarjeta.
 * En pantallas anchas se ve como una tarjeta centrada con ancho de celular;
 * en el celular ocupa toda la pantalla.
 *
 * La tarjeta es `relative`, así que los elementos `absolute` (como el botón +)
 * quedan anclados a ella y no se mueven con el scroll. Las hojas inferiores se montan
 * acá adentro con un portal (id="marco"), estén donde estén en el árbol.
 */
export function MarcoApp({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 flex justify-center bg-exterior sm:py-6">
      <div id="marco" className="relative flex h-full w-full max-w-md flex-col overflow-hidden bg-fondo sm:rounded-3xl">
        {children}
      </div>
    </div>
  );
}
