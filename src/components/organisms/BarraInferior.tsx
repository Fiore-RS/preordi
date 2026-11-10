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
        `flex min-h-[52px] min-w-0 flex-col items-center justify-center gap-0.5 text-[11px] ${
          isActive ? 'font-bold text-barra-activo' : 'font-medium text-barra-inactivo hover:text-barra-activo'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icono nombre={icono} tamano={24} grosor={isActive ? 2.1 : 1.8} />
          <span className="max-w-full truncate">{texto}</span>
        </>
      )}
    </NavLink>
  );
}

/**
 * Barra marino (propuesta 22 con nombres) de lado a lado y pegada abajo, con solo las esquinas
 * superiores redondeadas. Va encima del contenido, que asoma por las esquinas al hacer scroll;
 * por eso las pantallas con barra dejan espacio abajo (ESPACIO_BARRA en LayoutPrincipal).
 * En el centro, el botón naranja de agregar, más grande y saliendo por arriba:
 * en Deseos agrega un deseo; en el resto, una preorden.
 * `z-20`: la animación de entrada de cada pantalla (opacidad) crea una capa que, sin esto,
 * se pintaba encima de la barra mientras carga.
 */
export function BarraInferior() {
  const { pathname } = useLocation();
  const enDeseos = pathname.startsWith('/deseos');

  return (
    <nav
      aria-label="Navegación principal"
      className="absolute inset-x-0 bottom-0 z-20 grid grid-cols-5 rounded-t-[24px] border border-b-0 border-barra-borde bg-barra px-1 pt-2 pb-[max(0.875rem,env(safe-area-inset-bottom))] shadow-[0_-10px_28px_-18px_rgba(13,23,38,0.6)]"
    >
      {IZQUIERDA.map((p) => (
        <Enlace key={p.a} {...p} />
      ))}
      <div className="flex justify-center">
        <Link
          to={enDeseos ? '/preordenes/nueva?estado=deseada' : '/preordenes/nueva'}
          aria-label={enDeseos ? 'Agregar deseo' : 'Agregar preorden'}
          className="-mt-7 flex size-[58px] items-center justify-center rounded-[18px] bg-naranja-500 text-marino-500 shadow-[0_10px_18px_-8px_rgba(13,23,38,0.6)] transition-transform active:scale-95"
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
