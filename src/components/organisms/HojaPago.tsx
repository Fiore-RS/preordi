import { useState, type FormEvent } from 'react';
import { NOMBRE_MOVIMIENTO, agregarPago, quitarPago, reemplazarPago, validarPagoEnDetalle } from '../../lib/acciones';
import { saldoPendiente } from '../../lib/calculos';
import { formatearMonto, parsearMonto } from '../../lib/dinero';
import { hoy as fechaDeHoy } from '../../lib/fechas';
import type { Pago, Preorden, TipoMovimiento } from '../../types';
import { Boton } from '../atoms/Boton';
import { Campo, CLASE_ENTRADA } from '../molecules/Campo';
import { CampoMonto } from '../molecules/CampoMonto';
import { Segmentado } from '../molecules/Segmentado';
import { HojaInferior } from './HojaInferior';

interface Props {
  preorden: Preorden;
  /** Si viene, se edita ese pago (y se puede eliminar). */
  pago?: Pago;
  onGuardar: (preorden: Preorden) => void;
  onCerrar: () => void;
}

const conGrupos = (n: number) => new Intl.NumberFormat('es-CR').format(n);

/** Registrar o editar un pago — especificación 8.6. */
export function HojaPago({ preorden, pago, onGuardar, onCerrar }: Props) {
  const hoy = fechaDeHoy();
  // El saldo "disponible" para este pago: al editar, sin contar el pago mismo.
  const base = pago ? { ...preorden, pagos: preorden.pagos.filter((x) => x.id !== pago.id) } : preorden;
  const saldo = saldoPendiente(base);

  const tipos: TipoMovimiento[] =
    base.pagos.length === 0 ? ['deposito', 'abono', 'saldo'] : ['abono', 'saldo', 'reembolso'];
  if (pago && !tipos.includes(pago.tipo)) tipos.push(pago.tipo);

  const [monto, setMonto] = useState(pago ? conGrupos(pago.monto) : '');
  const [tipo, setTipo] = useState<TipoMovimiento>(pago?.tipo ?? (base.pagos.length === 0 ? 'deposito' : 'abono'));
  const [fecha, setFecha] = useState(pago?.fecha ?? hoy);
  const [nota, setNota] = useState(pago?.nota ?? '');
  const [error, setError] = useState<string | null>(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);

  function guardar(e: FormEvent) {
    e.preventDefault();
    const valor = parsearMonto(monto);
    if (valor === null) return setError('Escribí un monto mayor que ₡0.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return setError('Elegí la fecha del pago.');
    const problema = validarPagoEnDetalle(preorden, valor, tipo, pago?.id);
    if (problema) return setError(problema);
    const datos = { fecha, monto: valor, tipo, ...(nota.trim() ? { nota: nota.trim() } : {}) };
    const ahora = new Date().toISOString();
    onGuardar(pago ? reemplazarPago(preorden, pago.id, datos, ahora) : agregarPago(preorden, datos, ahora));
  }

  if (confirmarEliminar && pago) {
    return (
      <HojaInferior titulo="¿Eliminar este pago?" onCerrar={onCerrar}>
        <p className="text-[15px] leading-relaxed text-tinta-suave">
          {NOMBRE_MOVIMIENTO[pago.tipo]} de {formatearMonto(pago.monto)}. El saldo se vuelve a calcular sin él.
        </p>
        <div className="flex gap-2.5">
          <Boton className="flex-1" onClick={() => setConfirmarEliminar(false)}>
            Volver
          </Boton>
          <Boton
            variante="principal"
            className="flex-1"
            onClick={() => onGuardar(quitarPago(preorden, pago.id, new Date().toISOString()))}
          >
            Eliminar
          </Boton>
        </div>
      </HojaInferior>
    );
  }

  return (
    <HojaInferior
      titulo={pago ? 'Editar pago' : 'Registrar pago'}
      subtitulo={
        <>
          {preorden.nombre} · saldo <span className="font-bold text-acento-texto tabular-nums">{formatearMonto(saldo)}</span>
        </>
      }
      onCerrar={onCerrar}
    >
      <form noValidate onSubmit={guardar} className="flex flex-col gap-5">
        <Campo id="campo-monto-pago" etiqueta="Monto" para="monto-pago" error={error ?? undefined}>
          <CampoMonto
            id="monto-pago"
            valor={monto}
            onCambio={(v) => {
              setMonto(v);
              setError(null);
            }}
            invalido={!!error}
            aria-describedby={error ? 'campo-monto-pago-error' : undefined}
          />
          {saldo > 0 && tipo !== 'reembolso' && (
            <button
              type="button"
              onClick={() => {
                setMonto(conGrupos(saldo));
                if (tipo !== 'deposito') setTipo('saldo');
                setError(null);
              }}
              className="self-start rounded-full bg-resalte px-3.5 py-2 text-[13px] font-bold text-resalte-texto"
            >
              Pagar saldo ({formatearMonto(saldo)})
            </button>
          )}
        </Campo>

        <Campo id="campo-tipo-pago" etiqueta="Tipo">
          <Segmentado
            etiqueta="Tipo de pago"
            valor={tipo}
            onCambio={(t) => {
              setTipo(t);
              setError(null);
            }}
            opciones={tipos.map((t) => ({ valor: t, texto: NOMBRE_MOVIMIENTO[t] }))}
          />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo id="campo-fecha-pago" etiqueta="Fecha" para="fecha-pago">
            <input
              id="fecha-pago"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className={`${CLASE_ENTRADA} h-12`}
            />
          </Campo>
          <Campo id="campo-nota-pago" etiqueta="Nota" para="nota-pago">
            <input
              id="nota-pago"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Opcional"
              autoComplete="off"
              className={`${CLASE_ENTRADA} h-12`}
            />
          </Campo>
        </div>

        <div className="flex gap-2.5 pt-1">
          <Boton className="flex-1" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" variante="principal" className="flex-[1.4]">
            Guardar pago
          </Boton>
        </div>
        {pago && (
          <button
            type="button"
            onClick={() => setConfirmarEliminar(true)}
            className="self-center py-2 text-sm font-bold text-acento-texto"
          >
            Eliminar pago
          </button>
        )}
      </form>
    </HojaInferior>
  );
}
