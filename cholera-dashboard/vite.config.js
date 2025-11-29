import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages base path - use environment variable or default to repository name
  base: process.env.VITE_BASE_PATH || '/HIP-Chloera-Watch/',
})
