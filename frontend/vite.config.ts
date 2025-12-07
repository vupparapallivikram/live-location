import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,          // allows mobile devices to connect
    port: 5173,          //Vite dev server port
    strictPort: true,    // ensures it does not change ports
  }
})
