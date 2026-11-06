import { Link, useSearchParams } from 'react-router';
import { Icono } from '../components/atoms/Icono';
import { Encabezado } from '../components/molecules/Encabezado';
import { FiltroPastilla } from '../components/molecules/FiltroPastilla';
import { Segmentado } from '../components/molecules/Segmentado';
import { usePreordi } from '../context/PreordiContext';
import { totalPagado } from '../lib/calculos';
import { formatearMonto } from '../lib/dinero';
import { formatearFecha, hoy as fechaDeHoy } from '../lib/fechas';
import { aniosDisponibles, fechaHistorial, resumenHistorial, type PestanaHistorial } from '../lib/historial';

const PESTANAS: { valor: PestanaHistorial; texto: string }[] = [
  { valor: 'recibidas', texto: 'Recibidas' },
  { valor: 'canceladas', texto: 'Canceladas' },
];

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

      <div className="flex flex-col gap-4 px-5 pt-4 pb-6">
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
            <section
              aria-label={`Resumen de ${anio}`}
              className="flex flex-col gap-4 rounded-[20px] border border-borde-suave bg-superficie p-[18px]"
            >
              <div className="flex items-end justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-[13px] text-tinta-suave">
                    {esRecibidas ? `Gastado en ${anio}` : `Perdido en ${anio}`}
                  </span>
                  <span
                    className={`font-display text-[32px] leading-tight font-bold tracking-tight tabular-nums ${
                      !esRecibidas && r.total > 0 ? 'text-acento-texto' : ''
                    }`}
                  >
                    {formatearMonto(r.total)}
                  </span>
                </div>
                <span className="pb-1 text-sm text-tinta-suave">
                  <span className="font-bold text-tinta tabular-nums">{r.items.length}</span>{' '}
                  {esRecibidas
                    ? r.items.length === 1 ? 'recibida' : 'recibidas'
                    : r.items.length === 1 ? 'cancelada' : 'canceladas'}
                </span>
              </div>

              {esRecibidas && r.porCategoria.length > 0 && (
                <ul aria-label="Gastado por categoría" className="flex flex-col gap-2.5">
                  {r.porCategoria.map((c) => (
                    <li key={c.categoriaId} className="flex flex-col gap-1">
                      <span className="flex justify-between text-[13px]">
                        <span>{nombreCategoria.get(c.categoriaId) ?? 'Sin categoría'}</span>
                        <span className="font-medium tabular-nums">{formatearMonto(c.monto)}</span>
                      </span>
                      <span className="h-2 overflow-hidden rounded-full bg-superficie-suave">
                        <span
                          className="block h-full rounded-full bg-naranja-500"
                          style={{ width: `${Math.max(4, Math.round((c.monto / maximo) * 100))}%` }}
                        />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {!esRecibidas && r.total === 0 && (
                <p className="text-[13px] text-tinta-suave">Todo lo que pagaste te lo devolvieron.</p>
              )}
            </section>

            <ul className="flex flex-col rounded-2xl border border-borde-suave bg-superficie">
              {r.items.map((p) => {
                const pagado = Math.max(0, totalPagado(p));
                return (
                  <li key={p.id} className="border-b border-borde-suave last:border-b-0">
                    <Link to={`/preordenes/${p.id}`} className="flex items-center gap-3 px-3.5 py-3 hover:bg-superficie-suave/60">
                      <span
                        aria-hidden="true"
                        className={`flex size-11 shrink-0 items-center justify-center rounded-[10px] ${
                          esRecibidas ? 'bg-tono-marino text-tono-marino-texto' : 'bg-tono-gris text-tono-gris-texto'
                        }`}
                      >
                        <Icono nombre={esRecibidas ? 'check' : 'cerrar'} grosor={2} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-[15px] font-medium">{p.nombre}</span>
                        <span className="text-[13px] text-tinta-suave">
                          {esRecibidas ? 'Recibida' : 'Cancelada'} el {formatearFecha(fechaHistorial(p)!)}
                        </span>
                      </span>
                      {esRecibidas ? (
                        <span className="text-[15px] font-bold whitespace-nowrap tabular-nums">{formatearMonto(pagado)}</span>
                      ) : pagado > 0 ? (
                        <span className="flex shrink-0 flex-col items-end">
                          <span className="text-[15px] font-bold whitespace-nowrap text-acento-texto tabular-nums">
                            {formatearMonto(pagado)}
                          </span>
                          <span className="text-xs text-tinta-suave">sin reembolsar</span>
                        </span>
                      ) : (
                        <span className="text-[13px] text-tinta-suave">Reembolsada</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
