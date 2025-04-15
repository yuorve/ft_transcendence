import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Resource-Policy": "cross-origin"
    },
    host: "localhost",
    allowedHosts: ["80-yuorve-fttranscendence-mwntw4fq46g.ws-eu118.gitpod.io","localhost"],
    port: 5173,
    strictPort: true
  }
})
