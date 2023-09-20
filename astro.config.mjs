import { defineConfig } from 'astro/config'
import preact from '@astrojs/preact'
import mdx from '@astrojs/mdx'

// https://astro.build/config
export default defineConfig({
	integrations: [
		// Enable Preact to support Preact JSX components.
		preact(),
		mdx()
	],
	vite: {
		esbuild: {
			// below is an option added to silence the vite warning that is related to "/** @jsxImportSource preact */" in various .jsx files.
			// (reference for a similar case: https://github.com/vitejs/vite-plugin-react/issues/12)
			jsx: 'automatic'
		}
	},
	site: 'https://shelterprotocol.net'
})
