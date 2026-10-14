import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app.tsx';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('index.html has no #root element.');

createRoot(root).render(
  <StrictMode>
    <Suspense fallback={<p className="page-loading">Loading…</p>}>
      <App />
    </Suspense>
  </StrictMode>,
);
