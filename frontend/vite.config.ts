import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
    // Escuchar en todas las interfaces, no solo localhost
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // Permitir hosts si lo necesitas
    allowedHosts: [
      '80-yuorve-fttranscendence-mwntw4fq46g.ws-eu118.gitpod.io',
      'localhost',
    ],
    // FORZAR polling para que Docker/WSL detecte cambios
    watch: {
      usePolling: true,
      interval: 100,
    },
    // HMR hacia tu host
    hmr: {
      protocol: 'wss',
      host: 'localhost',
      port: 443,
      clientPort: 443
    },
  },
})


// import { defineConfig } from 'vite'
// import vue from '@vitejs/plugin-vue'
// import tailwindcss from '@tailwindcss/vite'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [vue(), tailwindcss()],
//   server: {
//     headers: {
//       "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
//       "Cross-Origin-Embedder-Policy": "require-corp",
//       "Cross-Origin-Resource-Policy": "cross-origin"
//     },
//     host: "localhost",
//     allowedHosts: ["80-yuorve-fttranscendence-mwntw4fq46g.ws-eu118.gitpod.io","localhost"],
//     port: 5173,
//     strictPort: true
//   }
// })
