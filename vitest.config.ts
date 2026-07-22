import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/tests/setup.ts'],
    restoreMocks: true,
    clearMocks: true,
    mockReset: true,
    exclude: ['node_modules', 'e2e/**'],
  },
})
