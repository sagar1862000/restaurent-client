// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import path from 'path'

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   resolve: {
//     alias: {
//       '@': path.resolve(__dirname, './src'),
//     },
//   },
//   preview: {
//     port: 5173,
//   },
//   build: {
//     rollupOptions: {
//       output: {
//         manualChunks: {
//           vendor: ['react', 'react-dom', 'react-router-dom'],
//         }
//       }
//     }
//   }
// })

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import nodePolyfills from 'rollup-plugin-polyfill-node'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      crypto: 'crypto-browserify', // 👈 Add this line
    },
  },
  define: {
    'process.env': {}, // 👈 Prevent undefined errors
  },
  preview: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      plugins: [nodePolyfills()], // 👈 Add this line
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        }
      }
    }
  }
})

