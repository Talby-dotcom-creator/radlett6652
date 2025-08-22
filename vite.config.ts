import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  optimizeDeps: {
    // keep/explore as needed; if icons fail to load during dev, try switching to `include: ['lucide-react']`
    exclude: ['lucide-react'],
  },

  // Ensure proper base URL
  base: '/',

  // Dev server (Bolt-friendly)
  server: {
    host: '0.0.0.0',   // needed so Bolt can proxy it
    port: 3000,        // match the port you expose in Bolt
    strictPort: true,  // fail if taken instead of silently switching
    open: false,
    hmr: { clientPort: 443 } // helps HMR when Bolt proxies via HTTPS
  },

  // Preview server for `vite preview`
  preview: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true
  },

  // Production build options (these were accidentally under "server" before)
  build: {
    sourcemap: true,
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },

  // Optional: if you rely on process.env in code
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
})
