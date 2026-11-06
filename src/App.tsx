import { useAplicarTema } from './lib/tema';
import { Navigate, Route, Routes } from 'react-router';
import { LayoutConBarra, LayoutSinBarra } from './components/organisms/LayoutPrincipal';
import { Configuracion } from './pages/Configuracion';
import { Deseos } from './pages/Deseos';
import { DetallePreorden } from './pages/DetallePreorden';
import { EditarPreorden } from './pages/EditarPreorden';
import { Historial } from './pages/Historial';
import { Inicio } from './pages/Inicio';
import { Preordenes } from './pages/Preordenes';

// Rutas — especificación sección 7.
export default function App() {
  useAplicarTema();
  return (
    <Routes>
      <Route element={<LayoutConBarra />}>
        <Route index element={<Inicio />} />
        <Route path="preordenes" element={<Preordenes />} />
        <Route path="deseos" element={<Deseos />} />
        <Route path="historial" element={<Historial />} />
      </Route>
      <Route element={<LayoutSinBarra />}>
        <Route path="preordenes/nueva" element={<EditarPreorden />} />
        <Route path="preordenes/:id" element={<DetallePreorden />} />
        <Route path="preordenes/:id/editar" element={<EditarPreorden />} />
        <Route path="config" element={<Configuracion />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
