import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        tailwindcss()
    ],
    server: {
        port: 5173, // Use different port from server
        proxy: {
            '/api': {
                target: 'https://localhost:1811',
                changeOrigin: true,
                secure: false // Accept self-signed certificates
            }
        }
    },
    build: {
        outDir: '../server/build',
        emptyOutDir: true,
    }
})
