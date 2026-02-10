import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
  tailwindcss(),
  VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'Inves - An Interview Practice App',
      short_name: 'Inves',
      description: 'Practice interviews with voice',
      theme_color: '#000000',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
      icons: [
        {
          src: '/logo.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/logo.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    }
  })
  ],
})
