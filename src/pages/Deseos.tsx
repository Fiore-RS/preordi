import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Boton } from '../components/atoms/Boton';
import { Icono } from '../components/atoms/Icono';
import { Encabezado } from '../components/molecules/Encabezado';
import { HojaEstado } from '../components/organisms/HojaEstado';
import { usePreordi } from '../context/PreordiContext';
import { costoTotal, totales } from '../lib/calculos';
import { formatearMonto } from '../lib/dinero';
import type { Preorden } from '../types';

// Especificación 8.3. "Apartar" abre la misma hoja que en el Detalle (tipo de pago + depósito)
// y al confirmar lleva al Detalle de la preorden ya apartada.
export function Deseos() {
  const { datos, dispatch } = usePreordi();
  const navigate = useNavigate();
  const [apartando, setApartando] = useState<Preorden | null>(null);
  const cerrar = useCallback(() => setApartando(null), []);

  const deseos = datos.preordenes
    .filter((p) => p.estado === 'deseada')
    .sort((a, b) => b.creadaEl.localeCompare(a.creadaEl));
  const total = totales(datos.preordenes).siApartaraDeseos;
  const nombreCategoria = new Map(datos.categorias.map((c) => [c.id, c.nombre]));

  function alApartar(preorden: Preorden) {
    dispatch({ tipo: 'guardarPreorden', preorden });
    setApartando(null);
    navigate(`/preordenes/${preorden.id}`);
  }

  return (
    <main className="flex flex-1 flex-col">
      <Encabezado titulo="Deseos" />

      {deseos.length === 0 ? (
        <section className="flex flex-1 flex-col items-center justify-center gap-3 px-8 pb-16 text-center">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-tono-amarillo text-tono-amarillo-texto">
            <Icono nombre="corazon" tamano={30} grosor={1.6} />
          </span>
          <p className="font-display text-xl font-bold">Tu lista de deseos está vacía</p>
          <p className="text-sm text-tinta-suave">Anotá lo que tenés en la mira y apartalo cuando estés lista.</p>
          <Link
            to="/preordenes/nueva?estado=deseada"
            className="mt-1 flex min-h-[50px] items-center rounded-full bg-principal px-6 font-bold text-principal-texto"
          >
            Agregar deseo
          </Link>
        </section>
      ) : (
        <div className="flex flex-col gap-4 px-5 pt-4 pb-20">
          <section
            aria-label="Total de deseos"
            className="flex items-end justify-between gap-3 rounded-[20px] bg-tono-amarillo px-5 py-4 text-tono-amarillo-texto"
          >
            <div className="flex flex-col">
              <span className="text-sm">Si apartaras todo</span>
              <span className="font-display text-[32px] leading-tight font-bold tracking-tight tabular-nums">
                {formatearMonto(total)}
              </span>
            </div>
            <span className="pb-1 text-sm font-medium">
              {deseos.length} {deseos.length === 1 ? 'deseo' : 'deseos'}
            </span>
          </section>

          <ul className="grid grid-cols-2 gap-3">
            {deseos.map((p) => (
              <li key={p.id} className="flex flex-col overflow-hidden rounded-[18px] border border-borde-suave bg-superficie">
                <Link to={`/preordenes/${p.id}`} className="flex flex-1 flex-col">
                  {/* Imagen (fase 6) */}
                  <span
                    aria-hidden="true"
                    className="flex aspect-square items-center justify-center bg-tono-amarillo-tenue text-tono-amarillo-tenue-texto"
                  >
                    <Icono nombre="imagen" tamano={34} grosor={1.5} />
                  </span>
                  <span className="flex flex-col gap-0.5 px-3 pt-3">
                    <span className="line-clamp-2 text-[15px] leading-snug font-medium">{p.nombre}</span>
                    <span className="text-[13px] text-tinta-suave">
                      <span className="tabular-nums">{formatearMonto(costoTotal(p))}</span>
                      {nombreCategoria.get(p.categoriaId) && ` · ${nombreCategoria.get(p.categoriaId)}`}
                    </span>
                  </span>
                </Link>
                <div className="p-3">
                  <Boton tamano="chico" className="w-full min-h-11! font-bold!" onClick={() => setApartando(p)}>
                    Apartar
                  </Boton>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        to="/preordenes/nueva?estado=deseada"
        aria-label="Agregar deseo"
        className="absolute right-5 bottom-24 z-10 flex size-15 items-center justify-center rounded-full bg-naranja-500 text-marino-500"
      >
        <Icono nombre="mas" tamano={28} grosor={2.2} />
      </Link>

      {apartando && <HojaEstado preorden={apartando} a="apartada" onGuardar={alApartar} onCerrar={cerrar} />}
    </main>
  );
}
