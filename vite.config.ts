import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { tanstackStart } from '@tanstack/start-vite-plugin';

export default defineConfig({
  plugins: [
    // Initializes TanStack Start with your custom server entry
    tanstackStart({
      server: { entry: "server" }
    }),
    // Enables React support
    react(),
    // Resolves standard TypeScript path aliases (like "@/*")
    tsconfigPaths(),
  ],
  server: {
    host: '127.0.0.1'
  }
});
