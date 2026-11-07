import { Link } from 'react-router';
import { formatearMonto } from '../../lib/dinero';
import {
  masUrgente,
  montoParaApartar,
  textoCuentaRegresiva,
  totalParaApartar,
  type AvisoPreventa,
  type Urgencia,
} from '../../lib/preventa';
import type { Preorden } from '../../types';
import { Icono } from '../atoms/Icono';
import { Miniatura } from '../atoms/Miniatura';

// Colores fijos en los dos modos: el aviso tiene que resaltar siempre. Sube de amarillo a naranja según se acerca el cierre.
const TONO: Record<Exclude<Urgencia, 'ninguna'>, string> = {
  aviso: 'bg-amarillo-500 text-marino-900',
  urgente: 'bg-naranja-300 text-marino-900',
  hoy: 'bg-naranja-500 text-marino-900',
};

const BOTON = 'flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-3.5 text-sm font-bold';
const BOTON_OSCURO = `${BOTON} bg-marino-700 text-papel hover:bg-marino-500`;
const BOTON_BORDE = `${BOTON} border-[1.5px] border-marino-900/70 hover:bg-marino-900/10`;

interface Props {
  avisos: AvisoPreventa[];
  hoy: string;
  /** Link para ir a apartarlo: el del producto o, si no hay, el de la tienda. */
  linkDe: (p: Preorden) => string | undefined;
  onApartar: (p: Preorden) => void;
}

function textoMonto(p: Preorden): string | null {
  const monto = montoParaApartar(p);
  if (monto === null) return null;
  if (monto === 0) return 'No pagás nada al apartar';
  return `Para apartar: ${formatearMonto(monto)}`;
}

/**
 * Aviso de Inicio para los deseos cuya preventa cierra pronto (especificación 5.9 y 8.1).
 * Se quita solo cuando el deseo se aparta, se elimina o pasa la fecha de cierre.
 */
export function AvisoPreventas({ avisos, hoy, linkDe, onApartar }: Props) {
  if (avisos.length === 0) return null;
  const urgencia = masUrgente(avisos.map((a) => a.info.urgencia));
  const tono = TONO[urgencia === 'ninguna' ? 'aviso' : urgencia];
  const unico = avisos.length === 1 ? avisos[0] : null;

  return (
    <section
      aria-labelledby="titulo-aviso-preventa"
      className={`mx-5 flex flex-col gap-3 rounded-[20px] p-4 shadow-[0_10px_24px_-14px_rgba(13,23,38,0.55)] ${tono}`}
    >
      <div className="flex items-center gap-2">
        <Icono nombre="reloj" tamano={20} grosor={2.2} className="shrink-0" />
        <h2 id="titulo-aviso-preventa" className="font-display text-[17px] leading-tight font-extrabold">
          {unico
            ? unico.info.urgencia === 'hoy'
              ? 'Último día para apartar'
              : 'Una preventa cierra pronto'
            : `${avisos.length} preventas cierran pronto`}
        </h2>
      </div>

      {unico ? (
        <UnAviso aviso={unico} hoy={hoy} link={linkDe(unico.preorden)} onApartar={onApartar} />
      ) : (
        <VariosAvisos avisos={avisos} hoy={hoy} onApartar={onApartar} />
      )}
    </section>
  );
}

function UnAviso({
  aviso: { preorden: p, info },
  hoy,
  link,
  onApartar,
}: {
  aviso: AvisoPreventa;
  hoy: string;
  link?: string;
  onApartar: (p: Preorden) => void;
}) {
  const monto = textoMonto(p);
  return (
    <>
      <Link to={`/preordenes/${p.id}`} className="flex items-center gap-3">
        <Miniatura imagenId={p.imagenId} className="size-16 rounded-xl" clasesMarcador="bg-papel/55 text-marino-700" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="line-clamp-2 text-[15px] leading-snug font-bold">{p.nombre}</span>
          <span className="text-[13px] font-medium">{textoCuentaRegresiva(p, info, hoy)}</span>
          {monto && <span className="text-[13px]">{monto}</span>}
        </span>
      </Link>
      <div className="flex gap-2">
        <button type="button" onClick={() => onApartar(p)} className={`${BOTON_OSCURO} flex-1`}>
          Apartar
        </button>
        {link && (
          <a href={link} target="_blank" rel="noreferrer" className={`${BOTON_BORDE} flex-1`}>
            <Icono nombre="enlace" tamano={16} grosor={2.2} />
            Ir a la tienda
          </a>
        )}
      </div>
    </>
  );
}

function VariosAvisos({ avisos, hoy, onApartar }: { avisos: AvisoPreventa[]; hoy: string; onApartar: (p: Preorden) => void }) {
  const { total, sinMonto } = totalParaApartar(avisos.map((a) => a.preorden));
  const todosSinMonto = sinMonto === avisos.length;
  return (
    <>
      <p className="-mt-1 text-[13px]">
        {todosSinMonto ? (
          'Anotá el depósito de cada una para saber cuánto necesitás.'
        ) : (
          <>
            Para apartarlas necesitás <strong className="font-display text-[15px] font-extrabold">{formatearMonto(total)}</strong>
            {sinMonto > 0 && ` (sin contar ${sinMonto} sin depósito anotado)`}
          </>
        )}
      </p>
      <ul className="flex flex-col divide-y divide-marino-900/15">
        {avisos.map(({ preorden: p, info }) => (
          <li key={p.id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
            <Link to={`/preordenes/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
              <Miniatura imagenId={p.imagenId} className="size-11 rounded-[10px]" clasesMarcador="bg-papel/55 text-marino-700" tamanoIcono={18} />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-bold">{p.nombre}</span>
                <span className={`text-[12.5px] ${info.urgencia === 'aviso' ? 'font-medium' : 'font-bold'}`}>
                  {textoCuentaRegresiva(p, info, hoy)}
                </span>
              </span>
            </Link>
            <button type="button" onClick={() => onApartar(p)} className={`${BOTON_OSCURO} shrink-0`}>
              Apartar
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
