import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// For GitHub Pages builds, set VITE_BASE to '/handyman/'.
// For normal deployments (Render/root), leave VITE_BASE unset (defaults to '/').
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/',
});

