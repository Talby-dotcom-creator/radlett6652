import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['@supabase/supabase-js', 'date-fns', 'react-hook-form']
  },
  // Add build configuration for better debugging
  build: {
    sourcemap: true,
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          forms: ['react-hook-form'],
          editor: ['react-quill', 'quill'],
          calendar: ['react-calendar', 'date-fns'],
          ui: ['lucide-react']
        },
      },
    },
  },
  // Add server configuration
  server: {
    port: 5173,
    host: true,
  },
  // Add preview configuration
  preview: {
    port: 4173,
    host: true,
  },
});