import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages serves project sites under /<repository>/.
// This file belongs exclusively to the isolated preview branch.
export default defineConfig({
  base: '/nutri-med/',
  plugins: [react(), tailwindcss()],
});
