import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Boton } from '../components/atoms/Boton';
import { Icono } from '../components/atoms/Icono';
import { Monto } from '../components/atoms/Monto';
import { Encabezado } from '../components/molecules/Encabezado';
import { TarjetaDeseo } from '../components/molecules/TarjetaDeseo';
import { HojaEstado } from '../components/organisms/HojaEstado';
import { usePreordi } from '../context/PreordiContext';
import { totales } from '../lib/calculos';
import type { Preorden } from '../types';

// Especificación 8.3, en la dirección Vitrina (10.9). "Apartar" abre la misma hoja que en el Detalle (tipo de pago + depósito)
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
          <p className="font-display text-xl font-bold">Tu lista de deseos está vacía</p>
          <p className="text-sm text-tinta-suave">Anotá lo que tenés en la mira y apartalo cuando estés lista.</p>
          <Link
            to="/preordenes/nueva?estado=deseada"
            className="mt-1 flex min-h-[50px] items-center rounded-2xl bg-principal px-6 font-bold text-principal-texto"
          >
            Agregar deseo
          </Link>
        </section>
      ) : (
        <div className="flex flex-col gap-4 px-5 pt-4 pb-20">
          <section aria-label="Total de deseos" className="flex flex-col gap-1">
            <span className="text-sm text-tinta-suave">Si apartaras todo</span>
            <Monto monto={total} className="font-display text-[44px] leading-none font-extrabold tracking-tight" />
            <span className="text-[13px] text-tinta-suave">
              {deseos.length} {deseos.length === 1 ? 'deseo' : 'deseos'} en la mira
            </span>
          </section>

          <ul className="grid grid-cols-2 gap-x-3 gap-y-5">
            {deseos.map((p) => (
              <li key={p.id} className="flex flex-col gap-2">
                <TarjetaDeseo preorden={p} categoria={nombreCategoria.get(p.categoriaId)} />
                <Boton tamano="chico" className="w-full font-bold!" onClick={() => setApartando(p)}>
                  Apartar
                </Boton>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        to="/preordenes/nueva?estado=deseada"
        aria-label="Agregar deseo"
        className="absolute right-5 bottom-24 z-10 flex size-15 items-center justify-center rounded-[20px] bg-naranja-500 text-marino-500 shadow-[0_10px_24px_-10px_rgba(13,23,38,0.55)]"
      >
        <Icono nombre="mas" tamano={28} grosor={2.2} />
      </Link>

      {apartando && <HojaEstado preorden={apartando} a="apartada" onGuardar={alApartar} onCerrar={cerrar} />}
    </main>
  );
}
