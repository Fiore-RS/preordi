import type { ReactNode } from 'react';
import type { Estado, EstadoPago } from '../../types';
import { NOMBRE_ESTADO } from '../../lib/acciones';
import { Icono } from './Icono';

type Tono = 'amarillo' | 'naranja' | 'celeste' | 'marino' | 'gris' | 'alerta';

// Colores de la especificación 10.2: relleno claro con el tono oscuro de la misma familia.
const TONOS: Record<Tono, string> = {
  amarillo: 'bg-tono-amarillo text-tono-amarillo-texto',
  naranja: 'bg-tono-naranja text-tono-naranja-texto',
  celeste: 'bg-tono-celeste text-tono-celeste-texto',
  marino: 'bg-tono-marino text-tono-marino-texto',
  gris: 'bg-tono-gris text-tono-gris-texto',
  alerta: 'bg-acento-tenue text-acento-texto font-bold',
};

export function Badge({ tono, children }: { tono: Tono; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-[3px] text-xs font-medium ${TONOS[tono]}`}>
      {children}
    </span>
  );
}

const TONO_ESTADO: Record<Estado, Tono> = {
  deseada: 'amarillo',
  apartada: 'naranja',
  en_camino: 'celeste',
  recibida: 'marino',
  cancelada: 'gris',
};

/** Relleno y texto del tono de un estado, para miniaturas y marcadores de imagen. */
export function claseTonoEstado(estado: Estado): string {
  return TONOS[TONO_ESTADO[estado]];
}

export function BadgeEstado({ estado }: { estado: Estado }) {
  return <Badge tono={TONO_ESTADO[estado]}>{NOMBRE_ESTADO[estado]}</Badge>;
}

export function BadgePago({ estadoPago }: { estadoPago: EstadoPago }) {
  if (estadoPago === 'completo') {
    return (
      <Badge tono="marino">
        <Icono nombre="check" tamano={13} grosor={2.4} />
        Pagado
      </Badge>
    );
  }
  return <Badge tono={estadoPago === 'parcial' ? 'naranja' : 'gris'}>{estadoPago === 'parcial' ? 'Parcial' : 'Sin pagar'}</Badge>;
}

export function BadgeVencida() {
  return (
    <Badge tono="alerta">
      <Icono nombre="alerta" tamano={13} grosor={2.2} />
      Vencida
    </Badge>
  );
}
