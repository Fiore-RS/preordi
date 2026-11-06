import { Link, NavLink, useLocation } from 'react-router';
import { Icono, type NombreIcono } from '../atoms/Icono';

type Pestana = { a: string; texto: string; icono: NombreIcono };

const IZQUIERDA: Pestana[] = [
  { a: '/', texto: 'Inicio', icono: 'inicio' },
  { a: '/preordenes', texto: 'Preórdenes', icono: 'caja' },
];
const DERECHA: Pestana[] = [
  { a: '/deseos', texto: 'Deseos', icono: 'corazon' },
  { a: '/historial', texto: 'Historial', icono: 'reloj' },
];

function Enlace({ a, texto, icono }: Pestana) {
  return (
    <NavLink
      to={a}
      end={a === '/'}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 text-xs ${isActive ? 'font-bold text-tinta' : 'font-medium text-tinta-suave'}`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`flex h-[30px] w-14 items-center justify-center rounded-full ${isActive ? 'bg-resalte text-resalte-texto' : ''}`}
          >
            <Icono nombre={icono} />
          </span>
          {texto}
        </>
      )}
    </NavLink>
  );
}

/**
 * Va al final de la tarjeta (en el flujo, no `fixed`), como en Sobres.
 * En el centro, el botón naranja de agregar, disponible en todas las pantallas con barra:
 * en Deseos agrega un deseo; en el resto, una preorden.
 * `relative z-20`: la animación de entrada de cada pantalla (opacidad) crea una capa que, sin esto,
 * se pintaba encima del + mientras carga.
 */
export function BarraInferior() {
  const { pathname } = useLocation();
  const enDeseos = pathname.startsWith('/deseos');

  return (
    <nav
      aria-label="Navegación principal"
      className="relative z-20 grid shrink-0 grid-cols-5 border-t border-borde bg-superficie px-1 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      {IZQUIERDA.map((p) => (
        <Enlace key={p.a} {...p} />
      ))}
      <div className="flex justify-center">
        <Link
          to={enDeseos ? '/preordenes/nueva?estado=deseada' : '/preordenes/nueva'}
          aria-label={enDeseos ? 'Agregar deseo' : 'Agregar preorden'}
          className="-mt-6 flex size-[54px] items-center justify-center rounded-[18px] bg-naranja-500 text-marino-500 shadow-[0_8px_18px_-8px_rgba(13,23,38,0.6)] ring-4 ring-superficie"
        >
          <Icono nombre="mas" tamano={28} grosor={2.4} />
        </Link>
      </div>
      {DERECHA.map((p) => (
        <Enlace key={p.a} {...p} />
      ))}
    </nav>
  );
}
