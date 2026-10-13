import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // The site is served from https://blencorp.github.io/react-lighthouse-viewer/.
  base: '/react-lighthouse-viewer/',
  plugins: [react()],
});
