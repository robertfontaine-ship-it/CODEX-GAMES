import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { installViewportReset } from './viewport-reset';
import './styles.css';
import './mobile-polish.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

installViewportReset();
