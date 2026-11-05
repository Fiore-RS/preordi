import { NavLink } from 'react-router';
import { Icono, type NombreIcono } from '../atoms/Icono';

const PESTANAS: { a: string; texto: string; icono: NombreIcono }[] = [
  { a: '/', texto: 'Inicio', icono: 'inicio' },
  { a: '/preordenes', texto: 'Preórdenes', icono: 'caja' },
  { a: '/deseos', texto: 'Deseos', icono: 'corazon' },
  { a: '/historial', texto: 'Historial', icono: 'reloj' },
];

/** Va al final de la tarjeta (en el flujo, no `fixed`), como en Sobres. */
export function BarraInferior() {
  return (
    <nav
      aria-label="Navegación principal"
      className="grid shrink-0 grid-cols-4 border-t border-marino-100 bg-white px-1.5 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      {PESTANAS.map(({ a, texto, icono }) => (
        <NavLink
          key={a}
          to={a}
          end={a === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-xs ${isActive ? 'font-bold text-marino-500' : 'font-medium text-marino-400'}`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`flex h-[30px] w-14 items-center justify-center rounded-full ${isActive ? 'bg-naranja-100' : ''}`}
              >
                <Icono nombre={icono} />
              </span>
              {texto}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
