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
	site: 'https://shelterprotocol.net'
})
