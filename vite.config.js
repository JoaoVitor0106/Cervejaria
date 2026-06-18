import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Rolldown (Vite 8) exige manualChunks como função
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Firebase isolado em chunk próprio — cache longo, raramente muda
          if (id.includes('node_modules/firebase')) {
            if (id.includes('firebase/auth') || id.includes('@firebase/auth')) {
              return 'firebase-auth';
            }
            if (id.includes('firebase/firestore') || id.includes('@firebase/firestore')) {
              return 'firebase-firestore';
            }
            return 'firebase-app';
          }
          // React + Router em chunk próprio
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'react-vendor';
          }
        }
      }
    },
    // Firebase é grande por natureza — avisa acima de 800KB
    chunkSizeWarningLimit: 800,
  }
})
