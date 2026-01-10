import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// Widget build configuration - creates a standalone embeddable widget
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    outDir: 'dist/widget',
    lib: {
      entry: path.resolve(__dirname, 'src/widget/widget-entry.tsx'),
      name: 'ResumeBuilderWidget',
      fileName: (format) => `resume-builder-widget.${format}.js`,
      formats: ['iife', 'es'],
    },
    rollupOptions: {
      output: {
        // Ensure all styles are inlined
        assetFileNames: 'resume-builder-widget.[ext]',
        // Global variables for IIFE build
        globals: {},
      },
    },
    // Inline all dependencies for standalone widget
    cssCodeSplit: false,
    sourcemap: true,
    minify: 'esbuild',
  },
});
