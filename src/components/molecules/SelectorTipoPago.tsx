import type { TipoPago } from '../../types';

const TIPOS_PAGO: { valor: TipoPago; titulo: string; detalle: string }[] = [
  { valor: 'deposito', titulo: 'Depósito + saldo', detalle: 'Pago una parte ahora y el resto al llegar' },
  { valor: 'completo', titulo: 'Pago completo', detalle: 'Ya la pagué toda' },
  { valor: 'al_envio', titulo: 'Pago al envío', detalle: 'Me cobran cuando la despachan' },
];

interface Props {
  valor: TipoPago;
  onCambio: (valor: TipoPago) => void;
}

/** Tarjetas de radio para elegir cómo se paga la preorden (especificación 5.6). */
export function SelectorTipoPago({ valor, onCambio }: Props) {
  return (
    <div role="radiogroup" aria-label="Tipo de pago" className="flex flex-col gap-2">
      {TIPOS_PAGO.map((t) => {
        const activo = t.valor === valor;
        return (
          <button
            key={t.valor}
            type="button"
            role="radio"
            aria-checked={activo}
            onClick={() => onCambio(t.valor)}
            className={`flex items-start gap-3 rounded-[14px] px-3.5 py-3 text-left transition-colors ${
              activo ? 'border-[1.5px] border-naranja-500 bg-naranja-50' : 'border border-marino-100 bg-white'
            }`}
          >
            <span
              aria-hidden="true"
              className={`mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 ${
                activo ? 'border-naranja-700' : 'border-marino-300'
              }`}
            >
              {activo && <span className="size-2 rounded-full bg-naranja-700" />}
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[15px] font-bold">{t.titulo}</span>
              <span className="text-[13px] text-marino-400">{t.detalle}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
