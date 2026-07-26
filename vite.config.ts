import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'prompt',
    includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'fonts/*.woff2'],
    manifest: {
      name: '攻略カンペメーカー',
      short_name: 'KampeMaker',
      description: 'ゲーム攻略用カンペ画像作成ツール',
      theme_color: '#1a1a2e',
      background_color: '#1a1a2e',
      display: 'standalone',
      icons: [
        {
          src: 'pwa-192x192.svg',
          sizes: '192x192',
          type: 'image/svg+xml',
        },
        {
          src: 'pwa-512x512.svg',
          sizes: '512x512',
          type: 'image/svg+xml',
        },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      cleanupOutdatedCaches: true,
    },
  }), cloudflare()],
})