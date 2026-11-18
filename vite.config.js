import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves the site from /<repo name>/; the deploy workflow sets BASE_PATH. Render uses the root.
  base: process.env.BASE_PATH || '/',
  // `npm start` serves the built site with `vite preview`; allow Render's *.onrender.com addresses.
  preview: { allowedHosts: ['.onrender.com'] },
});
