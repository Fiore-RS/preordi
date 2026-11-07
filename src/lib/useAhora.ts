import { useEffect, useState } from 'react';

/**
 * La hora actual, que se actualiza cada minuto y al volver a la app.
 * Así el aviso de preventa se quita solo cuando pasa la hora de cierre, aunque la app quede abierta.
 */
export function useAhora(): Date {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const actualizar = () => setAhora(new Date());
    const intervalo = window.setInterval(actualizar, 60_000);
    const alVolver = () => {
      if (document.visibilityState === 'visible') actualizar();
    };
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener('visibilitychange', alVolver);
    };
  }, []);
  return ahora;
}
