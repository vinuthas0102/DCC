import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react-router-dom',
      'zustand',
    ],
    exclude: ['lucide-react', 'framer-motion'],
    entries: ['index.html'],
    force: false,
  },
  server: {
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/monolith_archive/**',
        '**/*.txt',
      ],
    },
    hmr: {
      overlay: false,
    },
    headers: {
      // Prevent index.html from being cached so browsers always fetch
      // fresh chunk URLs after a new deploy.
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-state': ['zustand'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
});
