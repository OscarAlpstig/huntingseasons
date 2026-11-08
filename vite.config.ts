import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), VitePWA({
        registerType: 'prompt', injectRegister: false, scope: '/huntingseasons/',
        manifest: {
            id: '/huntingseasons/', name: 'Jaktsäsong', short_name: 'Jaktsäsong', lang: 'sv',
            description: 'Jakttider, sol och måne samt jaktplanering – även offline.',
            start_url: '/huntingseasons/', scope: '/huntingseasons/', display: 'standalone',
            theme_color: '#061b18', background_color: '#061b18',
            icons: [{ src: 'app-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
        },
        workbox: {
            cacheId: 'huntingseasons-app',
            globPatterns: ['**/*.{js,css,html,png,svg,woff2,webmanifest}'],
            globIgnores: ['offline-maps/**'],
            navigateFallback: '/huntingseasons/index.html',
            navigateFallbackAllowlist: [/^\/huntingseasons(?:\/|$)/],
            cleanupOutdatedCaches: false, skipWaiting: false, clientsClaim: true,
            // No runtime caching/prefetch of OSM, OpenTopoMap or weather requests.
        },
    })],
    base: '/huntingseasons/',
    test: { exclude: ['tests/**', 'node_modules/**', 'dist/**'] },
})
