import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use root path for Netlify/Vercel, or environment variable if set (for GitHub Pages)
  base: process.env.VITE_BASE_PATH || '/',
})
