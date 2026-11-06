interface Props {
  id?: string;
  /** Palabra en etiqueta sólida, en mayúsculas (ej. "Llegan"). */
  etiqueta: string;
  /** Palabra destacada a la par, en naranja (ej. "pronto"). */
  acento: string;
  className?: string;
  /** Por defecto es un h2; "p" cuando acompaña a otro título (ej. categoría y estado en el detalle). */
  como?: 'h2' | 'p';
}

/** Título de sección de la Vitrina: una etiqueta sólida y una palabra en naranja (especificación 10.9). */
export function TituloEtiqueta({ id, etiqueta, acento, className = '', como: Etiqueta = 'h2' }: Props) {
  return (
    <Etiqueta id={id} className={`flex items-center gap-1.5 ${className}`}>
      <span className="rounded-[5px] bg-tinta px-[7px] pt-[3px] pb-0.5 font-display text-[13px] font-extrabold tracking-[0.04em] text-fondo uppercase">
        {etiqueta}
      </span>
      <span className="font-display text-xl leading-none font-extrabold tracking-tight text-acento-texto">{acento}</span>
    </Etiqueta>
  );
}
