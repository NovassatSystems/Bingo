
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import './index.css';

/**
 * Bingo Tracker
 *
 * Ponto de entrada da aplicação.
 *
 * React 19 + TypeScript + Vite
 */

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'Não foi possível inicializar o Bingo Tracker: ' +
    'elemento #root não encontrado.',
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
