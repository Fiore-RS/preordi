import { useState, type FormEvent } from 'react';
import { apartar, avisoTransicion, cambiarEstado, pagoSugeridoAlCambiar, textoTransicion } from '../../lib/acciones';
import { costoTotal } from '../../lib/calculos';
import { formatearMonto, parsearMonto } from '../../lib/dinero';
import { hoy as fechaDeHoy } from '../../lib/fechas';
import type { Estado, Preorden, TipoPago } from '../../types';
import { Boton } from '../atoms/Boton';
import { Campo, CLASE_ENTRADA } from '../molecules/Campo';
import { CampoMonto } from '../molecules/CampoMonto';
import { SelectorTipoPago } from '../molecules/SelectorTipoPago';
import { HojaInferior } from './HojaInferior';

interface Props {
  preorden: Preorden;
  a: Estado;
  onGuardar: (preorden: Preorden) => void;
  onCerrar: () => void;
}

const ETIQUETA_FECHA: Partial<Record<Estado, string>> = {
  apartada: 'Apartada el',
  en_camino: 'Enviada el',
  recibida: 'Recibida el',
  cancelada: 'Cancelada el',
};

/**
 * Cambiar de estado — especificación 5.5 y 5.6. La fecha es hoy por defecto y se puede cambiar.
 * Al apartar un deseo pide el tipo de pago; al despachar (pago al envío) o al recibir con saldo,
 * ofrece registrar ese pago en el mismo paso.
 */
export function HojaEstado({ preorden, a, onGuardar, onCerrar }: Props) {
  const hoy = fechaDeHoy();
  const esApartarDeseo = preorden.estado === 'deseada' && a === 'apartada';
  const sugerido = pagoSugeridoAlCambiar(preorden, a);
  const aviso = avisoTransicion(preorden.estado, a);
  const costo = costoTotal(preorden);

  const [fecha, setFecha] = useState(hoy);
  const [tipoPago, setTipoPago] = useState<TipoPago>(preorden.tipoPago);
  const [deposito, setDeposito] = useState('');
  const [registrarPago, setRegistrarPago] = useState(sugerido > 0);
  const [error, setError] = useState<string | null>(null);

  function guardar(e: FormEvent) {
    e.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return setError('Elegí la fecha.');
    const ahora = new Date().toISOString();

    if (esApartarDeseo) {
      let monto: number | undefined;
      if (tipoPago === 'deposito') {
        monto = parsearMonto(deposito) ?? undefined;
        if (monto === undefined) return setError('Escribí el monto del depósito.');
        if (monto >= costo) return setError('El depósito tiene que ser menor que el costo total.');
      }
      return onGuardar(apartar(preorden, tipoPago, fecha, ahora, monto));
    }

    const pago = registrarPago && sugerido > 0 ? { monto: sugerido, tipo: 'saldo' as const } : undefined;
    onGuardar(cambiarEstado(preorden, a, fecha, ahora, pago));
  }

  const textoPago =
    a === 'en_camino'
      ? `Registrar el cobro del envío (${formatearMonto(sugerido)})`
      : `Registrar el pago del saldo (${formatearMonto(sugerido)})`;

  return (
    <HojaInferior titulo={textoTransicion(preorden.estado, a)} subtitulo={preorden.nombre} onCerrar={onCerrar}>
      <form noValidate onSubmit={guardar} className="flex flex-col gap-5">
        {aviso && <p className="text-[15px] leading-relaxed text-marino-400">{aviso}</p>}

        {esApartarDeseo && (
          <Campo id="campo-tipo-apartar" etiqueta="Tipo de pago">
            <SelectorTipoPago
              valor={tipoPago}
              onCambio={(t) => {
                setTipoPago(t);
                setError(null);
              }}
            />
          </Campo>
        )}

        <div className="grid grid-cols-2 gap-3">
          {esApartarDeseo && tipoPago === 'deposito' && (
            <Campo id="campo-deposito-apartar" etiqueta="Depósito" para="deposito-apartar">
              <CampoMonto
                id="deposito-apartar"
                valor={deposito}
                onCambio={(v) => {
                  setDeposito(v);
                  setError(null);
                }}
                invalido={!!error}
              />
            </Campo>
          )}
          {ETIQUETA_FECHA[a] && (
            <Campo id="campo-fecha-estado" etiqueta={ETIQUETA_FECHA[a]!} para="fecha-estado">
              <input
                id="fecha-estado"
                type="date"
                value={fecha}
                max={hoy}
                onChange={(e) => setFecha(e.target.value)}
                className={`${CLASE_ENTRADA} h-12`}
              />
            </Campo>
          )}
        </div>
        {esApartarDeseo && tipoPago !== 'deposito' && (
          <p className="-mt-3 text-[13px] text-marino-400">
            {tipoPago === 'completo'
              ? `Se registra un pago de ${formatearMonto(costo)}.`
              : `Queda todo pendiente: ${formatearMonto(costo)}.`}
          </p>
        )}

        {sugerido > 0 && !esApartarDeseo && (
          <label className="flex cursor-pointer items-center gap-3 rounded-[14px] border border-marino-100 bg-white px-3.5 py-3">
            <input
              type="checkbox"
              checked={registrarPago}
              onChange={(e) => setRegistrarPago(e.target.checked)}
              className="size-5 shrink-0 accent-naranja-700"
            />
            <span className="text-[15px] font-medium">{textoPago}</span>
          </label>
        )}

        {error && <p className="text-[13px] font-medium text-naranja-700">{error}</p>}

        <div className="flex gap-2.5 pt-1">
          <Boton className="flex-1" onClick={onCerrar}>
            Volver
          </Boton>
          <Boton type="submit" variante="principal" className="flex-[1.4]">
            {textoTransicion(preorden.estado, a)}
          </Boton>
        </div>
      </form>
    </HojaInferior>
  );
}
