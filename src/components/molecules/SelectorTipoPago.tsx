import type { TipoPago } from '../../types';

const TIPOS_PAGO: { valor: TipoPago; titulo: string; detalle: string }[] = [
  { valor: 'deposito', titulo: 'Depósito + saldo', detalle: 'Pago una parte ahora y el resto al llegar' },
  { valor: 'completo', titulo: 'Pago completo', detalle: 'Ya la pagué toda' },
  { valor: 'al_envio', titulo: 'Pago al envío', detalle: 'Me cobran cuando la despachan' },
];

/** Para un deseo se habla en futuro: todavía no se ha pagado nada. */
const DETALLE_DESEO: Record<TipoPago, string> = {
  deposito: 'Se paga una parte al apartar y el resto al llegar',
  completo: 'Se paga todo al apartar',
  al_envio: 'Cobran cuando la despachan',
};

interface Props {
  valor: TipoPago;
  onCambio: (valor: TipoPago) => void;
  /** Textos para un deseo que todavía no se aparta. */
  paraDeseo?: boolean;
}

/** Tarjetas de radio para elegir cómo se paga la preorden (especificación 5.6). */
export function SelectorTipoPago({ valor, onCambio, paraDeseo = false }: Props) {
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
              activo ? 'border-[1.5px] border-tinta bg-superficie' : 'border border-borde bg-superficie'
            }`}
          >
            <span
              aria-hidden="true"
              className={`mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 ${
                activo ? 'border-tinta' : 'border-borde-fuerte'
              }`}
            >
              {activo && <span className="size-2 rounded-full bg-tinta" />}
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[15px] font-bold">{t.titulo}</span>
              <span className="text-[13px] text-tinta-suave">{paraDeseo ? DETALLE_DESEO[t.valor] : t.detalle}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
