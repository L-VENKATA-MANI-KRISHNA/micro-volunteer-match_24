import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Enables React's automatic JSX runtime and Fast Refresh during development.
export default defineConfig({
  plugins: [react()],
});
