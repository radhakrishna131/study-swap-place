import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';

export default defineConfig({
  plugins: [
    tanstackStart({
      server: { entry: 'server' },
    }),
    react(),
    tsconfigPaths(),
  ],
  server: {
    host: '127.0.0.1',
  },
});
