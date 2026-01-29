import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    watch: {
      ignored: ['**/node_modules/**'], // Don't watch node_modules to prevent dependency updates
    },
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    // Compression for production
    mode === 'production' && viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    mode === 'production' && viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    // Bundle analyzer (generate stats.html after build)
    mode === 'production' && visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Disable esbuild completely to avoid permission issues on Windows
  // We're using @vitejs/plugin-react-swc for transforms, so esbuild isn't needed
  esbuild: false,
  
  // Optimize dependencies - React needs to be included for jsx-runtime to work
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react-router-dom',
      '@supabase/supabase-js',
    ],
    exclude: [], // Don't exclude everything - React needs optimization
  },
  
  // Build configuration with minification and code splitting
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production', // Remove console.log in production
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React vendor chunk
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          // Router vendor chunk
          if (id.includes('node_modules/react-router')) {
            return 'router-vendor';
          }
          // Radix UI components chunk
          if (id.includes('node_modules/@radix-ui')) {
            return 'ui-vendor';
          }
          // Supabase vendor chunk
          if (id.includes('node_modules/@supabase')) {
            return 'supabase-vendor';
          }
          // Icons vendor chunk
          if (id.includes('node_modules/lucide-react')) {
            return 'icons-vendor';
          }
          // Admin page is large, split it into its own chunk
          if (id.includes('/pages/Admin') || id.includes('/pages\\Admin')) {
            return 'admin-page';
          }
          // TicketCheckout page is large, split it into its own chunk
          if (id.includes('/pages/Soli-BeitragCheckout') || id.includes('\\pages\\Soli-BeitragCheckout')) {
            return 'checkout-page';
          }
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
}));
