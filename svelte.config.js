import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Use static adapter to generate static HTML/CSS/JS files for web hosting
		adapter: adapter({
			// Output directory for built files (default: 'build')
			pages: 'build',
			assets: 'build',
			fallback: undefined,
			// Enable precompression for faster initial loads
			precompress: true, // Generates .br and .gz files
			strict: true
		})
	}
};

export default config;
