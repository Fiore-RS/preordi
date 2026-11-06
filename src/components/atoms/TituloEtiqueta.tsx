interface Props {
  id?: string;
  /** Palabra en etiqueta sólida, en mayúsculas (ej. "Llegan"). */
  etiqueta: string;
  /** Palabra escrita a mano a la par (ej. "pronto"). */
  mano: string;
  className?: string;
}

/** Título de sección de la Vitrina: una etiqueta sólida y una palabra a mano (especificación 10.9). */
export function TituloEtiqueta({ id, etiqueta, mano, className = '' }: Props) {
  return (
    <h2 id={id} className={`flex items-baseline gap-1.5 ${className}`}>
      <span className="rounded-[5px] bg-tinta px-[7px] pt-[3px] pb-0.5 font-display text-[13px] font-extrabold tracking-[0.04em] text-fondo uppercase">
        {etiqueta}
      </span>
      <span className="font-mano text-[30px] leading-[0.8] font-bold">{mano}</span>
    </h2>
  );
}
