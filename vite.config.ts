import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
    mode === 'development' &&
    componentTagger(),
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
    ],
    exclude: [], // Don't exclude everything - React needs optimization
  },
  
  // Use terser for minification instead of esbuild (or disable minification)
  build: {
    minify: false, // Disable minification to avoid esbuild, or install terser and use 'terser'
  },
}));
