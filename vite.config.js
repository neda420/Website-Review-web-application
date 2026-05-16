import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/Website-Review-web-application/',
  plugins: [react()],
})
