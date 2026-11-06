import { Link, useSearchParams } from 'react-router';
import { Icono } from '../components/atoms/Icono';
import { Encabezado } from '../components/molecules/Encabezado';
import { FiltroPastilla } from '../components/molecules/FiltroPastilla';
import { Segmentado } from '../components/molecules/Segmentado';
import { TarjetaPreorden } from '../components/molecules/TarjetaPreorden';
import { usePreordi } from '../context/PreordiContext';
import { saldoPendiente } from '../lib/calculos';
import { formatearMonto } from '../lib/dinero';
import { hoy as fechaDeHoy } from '../lib/fechas';
import {
  FILTROS_POR_DEFECTO,
  ORDENES,
  PESTANAS,
  filtrarYOrdenar,
  filtrosAURL,
  filtrosDesdeURL,
  type FiltrosListado,
} from '../lib/listado';

// Especificación 8.2. Los filtros viven en la URL (#/preordenes?estado=en_camino…),
// así Inicio puede enlazar directo a una lista filtrada y se conservan al volver del Detalle.
export function Preordenes() {
  const { datos } = usePreordi();
  const [params, setParams] = useSearchParams();
  const filtros = filtrosDesdeURL(params);
  const hoy = fechaDeHoy();

  const cambiar = (cambios: Partial<FiltrosListado>) =>
    setParams(filtrosAURL({ ...filtros, ...cambios }), { replace: true });

  const lista = filtrarYOrdenar(datos.preordenes, filtros);
  const hayAlguna = datos.preordenes.some((p) => p.estado !== 'deseada');
  const hayFiltrosExtra = filtros.categoriaId !== null || filtros.tiendaId !== null;
  const saldo = lista.reduce((suma, p) => suma + saldoPendiente(p), 0);
  const nombreTienda = new Map(datos.tiendas.map((t) => [t.id, t.nombre]));
  const conEstado = filtros.estado === 'activas' || filtros.estado === 'todas';
  const categorias = [...datos.categorias].sort((a, b) => a.orden - b.orden);

  return (
    <main className="flex flex-1 flex-col">
      <Encabezado titulo="Preórdenes" />

      {!hayAlguna ? (
        <section className="flex flex-1 flex-col items-center justify-center gap-3 px-8 pb-16 text-center">
          <p className="font-display text-xl font-bold">Todavía no hay preórdenes</p>
          <p className="text-sm text-tinta-suave">Cuando apartes algo, aparece acá con su saldo y su fecha.</p>
          <Link
            to="/preordenes/nueva"
            className="mt-1 flex min-h-[50px] items-center rounded-2xl bg-principal px-6 font-bold text-principal-texto"
          >
            Agregar preorden
          </Link>
        </section>
      ) : (
        <div className="flex flex-col gap-4 px-5 pt-4 pb-20">
          <Segmentado
            etiqueta="Filtrar por estado"
            valor={filtros.estado}
            onCambio={(estado) => cambiar({ estado })}
            opciones={PESTANAS}
          />

          {/* Una sola fila que se desliza de lado si no cabe */}
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
            <FiltroPastilla
              etiqueta="Categoría"
              textoTodas="Categoría"
              valor={filtros.categoriaId ?? ''}
              onCambio={(v) => cambiar({ categoriaId: v || null })}
              opciones={categorias.map((c) => ({ valor: c.id, texto: c.nombre }))}
            />
            {datos.tiendas.length > 0 && (
              <FiltroPastilla
                etiqueta="Tienda"
                textoTodas="Tienda"
                valor={filtros.tiendaId ?? ''}
                onCambio={(v) => cambiar({ tiendaId: v || null })}
                opciones={datos.tiendas.map((t) => ({ valor: t.id, texto: t.nombre }))}
              />
            )}
            <FiltroPastilla
              etiqueta="Ordenar por"
              icono="ordenar"
              valor={filtros.orden}
              onCambio={(v) => cambiar({ orden: v as FiltrosListado['orden'] })}
              opciones={ORDENES}
            />
          </div>

          {lista.length > 0 ? (
            <>
              <p className="flex items-baseline justify-between text-[13px] text-tinta-suave" aria-live="polite">
                <span>
                  {lista.length} {lista.length === 1 ? 'preorden' : 'preórdenes'}
                </span>
                {saldo > 0 && (
                  <span>
                    Saldo <span className="font-bold text-tinta tabular-nums">{formatearMonto(saldo)}</span>
                  </span>
                )}
              </p>
              <ul className="-mt-1 flex flex-col divide-y divide-borde-suave">
                {lista.map((p) => (
                  <li key={p.id}>
                    <TarjetaPreorden
                      preorden={p}
                      tienda={p.tiendaId ? nombreTienda.get(p.tiendaId) : undefined}
                      hoy={hoy}
                      conEstado={conEstado}
                    />
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <section className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <p className="font-display text-lg font-bold">Nada por acá</p>
              <p className="text-sm text-tinta-suave">
                {hayFiltrosExtra ? 'No hay preórdenes con estos filtros.' : 'No hay preórdenes en este estado.'}
              </p>
              {(hayFiltrosExtra || filtros.estado !== FILTROS_POR_DEFECTO.estado) && (
                <button
                  type="button"
                  onClick={() => setParams(filtrosAURL({ ...FILTROS_POR_DEFECTO, orden: filtros.orden }), { replace: true })}
                  className="mt-1 text-sm font-bold text-acento-texto underline underline-offset-4"
                >
                  Quitar filtros
                </button>
              )}
            </section>
          )}
        </div>
      )}

      <Link
        to="/preordenes/nueva"
        aria-label="Agregar preorden"
        className="absolute right-5 bottom-24 z-10 flex size-15 items-center justify-center rounded-[20px] bg-naranja-500 text-marino-500 shadow-[0_10px_24px_-10px_rgba(13,23,38,0.55)]"
      >
        <Icono nombre="mas" tamano={28} grosor={2.2} />
      </Link>
    </main>
  );
}
