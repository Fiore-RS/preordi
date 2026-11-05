import { Icono } from '../atoms/Icono';

/** Marcador temporal para pantallas que aún no se construyen. */
export function Pendiente({ seccion }: { seccion: string }) {
  return (
    <div className="mx-5 mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-marino-100 px-6 py-10 text-center text-marino-400">
      <Icono nombre="caja" tamano={32} grosor={1.5} />
      <p className="text-sm">Pantalla pendiente. Ver la especificación, sección {seccion}.</p>
    </div>
  );
}
