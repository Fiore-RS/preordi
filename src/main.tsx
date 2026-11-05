import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/dm-sans';
import './index.css';
import App from './App';
import { PreordiProvider } from './context/PreordiContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <PreordiProvider>
        <App />
      </PreordiProvider>
    </HashRouter>
  </StrictMode>,
);
