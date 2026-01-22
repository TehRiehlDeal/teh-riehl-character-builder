import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	build: {
		// Increase chunk size warning limit for data-heavy routes
		chunkSizeWarningLimit: 600,
		rollupOptions: {
			output: {
				// Manual chunk splitting for better caching
				manualChunks(id) {
					// Vendor chunk for node_modules
					if (id.includes('node_modules')) {
						return 'vendor';
					}
					// Separate chunk for data adapters (used across multiple routes)
					if (id.includes('/data/adapters/')) {
						return 'data-adapters';
					}
					// Separate chunk for data repositories
					if (id.includes('/data/repositories/')) {
						return 'data-repositories';
					}
					// Separate chunk for database module
					if (id.includes('/data/database/')) {
						return 'data-database';
					}
					// Separate chunk for large wizard components
					if (id.includes('/components/wizard/')) {
						return 'wizard-components';
					}
				}
			}
		}
	},
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			srcDir: './src',
			mode: 'production',
			scope: '/',
			base: '/',
			selfDestroying: false,
			manifest: {
				short_name: 'PF2e Builder',
				name: 'PF2e Character Builder',
				start_url: '/',
				scope: '/',
				display: 'standalone',
				theme_color: '#5c16c5',
				background_color: '#1a1a1a',
				icons: [
					{
						src: '/icons/icon-192x192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: '/icons/icon-512x512.png',
						sizes: '512x512',
						type: 'image/png'
					},
					{
						src: '/icons/icon-512x512-maskable.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			},
			injectManifest: {
				globPatterns: ['**/*.{js,css,html,svg,png,ico,txt,woff,woff2}']
			},
			workbox: {
				// Precache static assets during build
				globPatterns: ['**/*.{js,css,html,svg,png,ico,txt,woff,woff2}'],

				// Exclude large data files from precache (they'll be cached on-demand)
				globIgnores: ['**/data/**/*.json', '**/data/*.db'],

				// Maximum cache size (100MB to accommodate database)
				maximumFileSizeToCacheInBytes: 100 * 1024 * 1024,

				runtimeCaching: [
					// SQLite database - Cache First, single file for all game data
					{
						urlPattern: /\/data\/pf2e\.db$/,
						handler: 'CacheFirst',
						options: {
							cacheName: 'pf2e-database-v2026.01.1',
							expiration: {
								maxEntries: 1,
								maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
							},
							cacheableResponse: {
								statuses: [200]
							}
						}
					},

					// WASM files for sql.js
					{
						urlPattern: /\/wasm\/.*\.wasm$/,
						handler: 'CacheFirst',
						options: {
							cacheName: 'wasm-v1',
							expiration: {
								maxEntries: 5,
								maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
							},
							cacheableResponse: {
								statuses: [200]
							}
						}
					},

					// Legacy: Game data JSON files (kept for backward compatibility)
					// IMPORTANT: Validates Content-Type to prevent caching HTML fallback pages as JSON
					{
						urlPattern: /\/data\/.*\.json$/,
						handler: 'CacheFirst',
						options: {
							cacheName: 'pf2e-game-data-v2026.01.3',
							expiration: {
								maxEntries: 10000,
								maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
							},
							cacheableResponse: {
								statuses: [200],
								headers: {
									'Content-Type': 'application/json'
								}
							}
						}
					},

					// External fonts
					{
						urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'google-fonts-cache',
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					},

					// External font files
					{
						urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'google-fonts-assets',
							expiration: {
								maxEntries: 20,
								maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					},

					// API calls (if any future API is added)
					{
						urlPattern: /\/api\/.*/i,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'api-cache',
							networkTimeoutSeconds: 10,
							expiration: {
								maxEntries: 50,
								maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					}
				],

				// No navigate fallback - let SvelteKit handle routing
				navigateFallback: null,

				// Clean old caches
				cleanupOutdatedCaches: true
			},
			devOptions: {
				enabled: true,
				type: 'module',
				navigateFallback: '/'
			}
		})
	]
});
