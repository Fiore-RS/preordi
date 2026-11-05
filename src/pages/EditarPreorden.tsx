import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { Encabezado } from '../components/molecules/Encabezado';
import { FormularioPreorden } from '../components/organisms/FormularioPreorden';
import { usePreordi } from '../context/PreordiContext';
import type { Preorden } from '../types';

// Especificación 8.5. Sirve para #/preordenes/nueva (con ?estado=deseada desde Deseos)
// y para #/preordenes/:id/editar.
export function EditarPreorden() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { datos, dispatch } = usePreordi();

  const original = id ? datos.preordenes.find((p) => p.id === id) : undefined;
  const esDeseo = params.get('estado') === 'deseada';

  if (id && !original) {
    return (
      <main className="flex flex-col">
        <Encabezado titulo="Editar preorden" volverA="/preordenes" />
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <p className="font-display text-xl font-bold">No encontramos esta preorden</p>
          <p className="text-sm text-marino-400">Puede que la hayas eliminado.</p>
          <Link to="/preordenes" className="font-bold text-naranja-700 underline underline-offset-4">
            Ver mis preórdenes
          </Link>
        </div>
      </main>
    );
  }

  const titulo = original ? 'Editar preorden' : esDeseo ? 'Nuevo deseo' : 'Nueva preorden';
  const volverA = original ? `/preordenes/${original.id}` : esDeseo ? '/deseos' : '/';

  function alGuardar(preorden: Preorden) {
    dispatch({ tipo: 'guardarPreorden', preorden });
    navigate(`/preordenes/${preorden.id}`, { replace: true });
  }

  return (
    <main className="flex flex-1 flex-col">
      <Encabezado titulo={titulo} volverA={volverA} iconoVolver="cerrar" />
      <FormularioPreorden
        key={original?.id ?? (esDeseo ? 'deseo' : 'nueva')}
        original={original}
        estadoInicial={esDeseo ? 'deseada' : 'apartada'}
        onGuardado={alGuardar}
      />
    </main>
  );
}
