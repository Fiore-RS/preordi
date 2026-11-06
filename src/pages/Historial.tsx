import { Link, useSearchParams } from 'react-router';
import { Monto } from '../components/atoms/Monto';
import { PortadaSinFoto } from '../components/atoms/PortadaSinFoto';
import { TituloEtiqueta } from '../components/atoms/TituloEtiqueta';
import { Encabezado } from '../components/molecules/Encabezado';
import { FiltroPastilla } from '../components/molecules/FiltroPastilla';
import { Segmentado } from '../components/molecules/Segmentado';
import { usePreordi } from '../context/PreordiContext';
import { totalPagado } from '../lib/calculos';
import { formatearMonto } from '../lib/dinero';
import { formatearFecha, hoy as fechaDeHoy } from '../lib/fechas';
import { aniosDisponibles, fechaHistorial, resumenHistorial, type PestanaHistorial } from '../lib/historial';
import { useImagen } from '../lib/useImagen';
import type { Preorden } from '../types';

const PESTANAS: { valor: PestanaHistorial; texto: string }[] = [
  { valor: 'recibidas', texto: 'Recibidas' },
  { valor: 'canceladas', texto: 'Canceladas' },
];

// Las barras por categoría recorren los colores de la bandera (Vitrina, 10.9).
const COLORES_BARRA = ['bg-naranja-500', 'bg-amarillo-500', 'bg-celeste-500', 'bg-marino-300'];

function FilaHistorial({ preorden: p, esRecibidas }: { preorden: Preorden; esRecibidas: boolean }) {
  const url = useImagen(p.imagenId);
  const pagado = Math.max(0, totalPagado(p));
  return (
    <Link to={`/preordenes/${p.id}`} className="-mx-2 flex items-center gap-3 rounded-2xl px-2 py-2.5 hover:bg-superficie-suave">
      <span
        className={`relative h-[60px] w-12 shrink-0 overflow-hidden rounded-xl bg-marino-500 ${esRecibidas ? '' : 'opacity-60 grayscale'}`}
      >
        {url ? (
          <img src={url} alt="" className="size-full object-cover" />
        ) : (
          <PortadaSinFoto nombre={p.nombre} estado={p.estado} className="pt-2.5 text-[34px]" />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-display text-[15px] font-bold">{p.nombre}</span>
        <span className="text-[13px] text-tinta-suave">
          {esRecibidas ? 'Llegó' : 'Cancelada'} el {formatearFecha(fechaHistorial(p)!)}
        </span>
      </span>
      {esRecibidas ? (
        <Monto monto={pagado} className="font-display text-base font-extrabold whitespace-nowrap" />
      ) : pagado > 0 ? (
        <span className="flex shrink-0 flex-col items-end">
          <Monto monto={pagado} className="font-display text-base font-extrabold whitespace-nowrap text-acento-texto" />
          <span className="text-xs text-tinta-suave">sin reembolsar</span>
        </span>
      ) : (
        <span className="text-[13px] text-tinta-suave">Reembolsada</span>
      )}
    </Link>
  );
}

// Especificación 8.8. La pestaña y el año viven en la URL (#/historial?pestana=canceladas&anio=2025),
// así se conservan al entrar a una preorden y volver.
export function Historial() {
  const { datos } = usePreordi();
  const [params, setParams] = useSearchParams();

  const pestana: PestanaHistorial = params.get('pestana') === 'canceladas' ? 'canceladas' : 'recibidas';
  const anios = aniosDisponibles(datos.preordenes, pestana);
  const pedido = Number(params.get('anio'));
  const anio = anios.includes(pedido) ? pedido : (anios[0] ?? Number(fechaDeHoy().slice(0, 4)));

  const cambiar = (cambios: { pestana?: PestanaHistorial; anio?: number }) => {
    const siguiente = new URLSearchParams();
    const p = cambios.pestana ?? pestana;
    if (p !== 'recibidas') siguiente.set('pestana', p);
    // Al cambiar de pestaña, el año vuelve al más reciente de esa pestaña.
    if (cambios.anio) siguiente.set('anio', String(cambios.anio));
    setParams(siguiente, { replace: true });
  };

  const r = resumenHistorial(datos.preordenes, pestana, anio);
  const nombreCategoria = new Map(datos.categorias.map((c) => [c.id, c.nombre]));
  const maximo = Math.max(1, ...r.porCategoria.map((c) => c.monto));
  const esRecibidas = pestana === 'recibidas';

  return (
    <main className="flex flex-1 flex-col">
      <Encabezado titulo="Historial" />

      <div className="flex flex-col gap-6 px-5 pt-4 pb-6">
        <div className="flex items-center gap-2.5">
          <div className="min-w-0 flex-1">
            <Segmentado
              etiqueta="Tipo de historial"
              valor={pestana}
              onCambio={(p) => cambiar({ pestana: p })}
              opciones={PESTANAS}
            />
          </div>
          {anios.length > 0 && (
            <FiltroPastilla
              etiqueta="Año"
              valor={String(anio)}
              onCambio={(v) => cambiar({ anio: Number(v) })}
              opciones={anios.map((a) => ({ valor: String(a), texto: String(a) }))}
            />
          )}
        </div>

        {anios.length === 0 ? (
          <section className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <p className="font-display text-xl font-bold">
              {esRecibidas ? 'Todavía no ha llegado nada' : 'No hay preórdenes canceladas'}
            </p>
            <p className="text-sm text-tinta-suave">
              {esRecibidas
                ? 'Cuando marques una preorden como recibida, aparece acá con lo que gastaste.'
                : 'Si alguna vez cancelás una, acá queda el registro de lo que no volvió.'}
            </p>
          </section>
        ) : (
          <>
            <section aria-label={`Resumen de ${anio}`} className="flex flex-col gap-1">
              <span className="text-sm text-tinta-suave">{esRecibidas ? `Gastado en ${anio}` : `Perdido en ${anio}`}</span>
              <Monto
                monto={r.total}
                className={`font-display text-[44px] leading-none font-extrabold tracking-tight ${
                  !esRecibidas && r.total > 0 ? 'text-acento-texto' : ''
                }`}
              />
              <span className="text-[13px] text-tinta-suave">
                {r.items.length}{' '}
                {esRecibidas
                  ? r.items.length === 1 ? 'preorden recibida' : 'preórdenes recibidas'
                  : r.items.length === 1 ? 'preorden cancelada' : 'preórdenes canceladas'}
                {!esRecibidas && r.total === 0 && ' · todo lo pagado volvió'}
              </span>
            </section>

            {esRecibidas && r.porCategoria.length > 0 && (
              <section aria-labelledby="titulo-categorias" className="flex flex-col gap-3">
                <TituloEtiqueta id="titulo-categorias" etiqueta="Por" acento="categoría" />
                <ul className="flex flex-col gap-3">
                  {r.porCategoria.map((c, i) => (
                    <li key={c.categoriaId} className="flex flex-col gap-1.5">
                      <span className="flex justify-between text-sm">
                        <span>{nombreCategoria.get(c.categoriaId) ?? 'Sin categoría'}</span>
                        <span className="font-display font-extrabold tabular-nums">{formatearMonto(c.monto)}</span>
                      </span>
                      <span className="h-2.5 overflow-hidden rounded-full bg-borde-suave">
                        <span
                          className={`block h-full rounded-full ${COLORES_BARRA[i % COLORES_BARRA.length]}`}
                          style={{ width: `${Math.max(4, Math.round((c.monto / maximo) * 100))}%` }}
                        />
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section aria-labelledby="titulo-lista" className="flex flex-col gap-1">
              <TituloEtiqueta
                id="titulo-lista"
                etiqueta={esRecibidas ? 'Llegaron' : 'Canceladas'}
                acento={`en ${anio}`}
                className="mb-1"
              />
              <ul className="flex flex-col divide-y divide-borde-suave">
                {r.items.map((p) => (
                  <li key={p.id}>
                    <FilaHistorial preorden={p} esRecibidas={esRecibidas} />
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
