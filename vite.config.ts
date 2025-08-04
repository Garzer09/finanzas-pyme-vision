import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: [
            '@radix-ui/react-accordion', 
            '@radix-ui/react-alert-dialog', 
            '@radix-ui/react-avatar',
            '@radix-ui/react-dialog', 
            '@radix-ui/react-dropdown-menu', 
            '@radix-ui/react-popover'
          ],
          charts: ['recharts'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          supabase: ['@supabase/supabase-js'],
          query: ['@tanstack/react-query'],
          excel: ['xlsx'],
          utils: ['lodash', 'date-fns', 'clsx']
        }
      }
    },
    // Increase chunk size warning limit for financial modules
    chunkSizeWarningLimit: 1000,
    // Enable minification with esbuild for better performance
    minify: mode === 'production' ? 'esbuild' : false,
    // Optimize CSS
    cssCodeSplit: true,
    // Source maps configuration
    sourcemap: mode === 'production' ? 'hidden' : true
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
}));