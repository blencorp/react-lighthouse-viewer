import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app.tsx';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense>
      <App />
    </Suspense>
  </StrictMode>,
);
