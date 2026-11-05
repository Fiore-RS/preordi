import type { ReactNode } from 'react';
import type { Estado, EstadoPago } from '../../types';
import { NOMBRE_ESTADO } from '../../lib/acciones';
import { Icono } from './Icono';

type Tono = 'amarillo' | 'naranja' | 'celeste' | 'marino' | 'gris' | 'alerta';

// Colores de la especificación 10.2: relleno claro con el tono oscuro de la misma familia.
const TONOS: Record<Tono, string> = {
  amarillo: 'bg-amarillo-100 text-amarillo-900',
  naranja: 'bg-naranja-100 text-naranja-900',
  celeste: 'bg-celeste-100 text-marino-700',
  marino: 'bg-marino-100 text-marino-700',
  gris: 'bg-marino-50 text-marino-400',
  alerta: 'bg-naranja-50 text-naranja-700 font-bold',
};

export function Badge({ tono, children }: { tono: Tono; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-[3px] text-xs font-medium ${TONOS[tono]}`}>
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
