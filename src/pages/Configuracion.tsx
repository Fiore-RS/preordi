import { Encabezado } from '../components/molecules/Encabezado';
import { Pendiente } from '../components/molecules/Pendiente';
import { usePreordi } from '../context/PreordiContext';

export function Configuracion() {
  const { datos } = usePreordi();
  return (
    <main className="mx-auto max-w-lg">
      <Encabezado titulo="Configuración" volverA="/" />
      <section className="flex flex-col gap-2.5 px-5 pt-2">
        <h2 className="text-lg font-bold">Categorías</h2>
        <ul className="rounded-2xl border border-borde-suave bg-superficie">
          {[...datos.categorias]
            .sort((a, b) => a.orden - b.orden)
            .map((c) => (
              <li key={c.id} className="border-b border-borde-suave px-3.5 py-3 last:border-b-0">
                {c.nombre}
              </li>
            ))}
        </ul>
      </section>
      <Pendiente seccion="8.9" />
    </main>
  );
}
