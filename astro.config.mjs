import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import mdx from '@astrojs/mdx';

import starlight from "@astrojs/starlight";

// https://astro.build/config
export default defineConfig({
  integrations: [
		// Enable Preact to support Preact JSX components.
		preact(),
		mdx(),
		starlight({
			title: 'Shelter protocol',
			defaultLocale: 'en',
			editLink: {
				baseUrl: 'https://github.com/okturtles/shelterprotocol.net/tree/master/'
			},
			logo: {
				src: './public/images/logo.svg'
			},
			locales: {
				en: {
					label: 'English'
				}
			}
		})
	],
  vite: {
    esbuild: {
      // below is an option added to silence the vite warning that is related to "/** @jsxImportSource preact */" in various .jsx files.
      // (reference for a similar case: https://github.com/vitejs/vite-plugin-react/issues/12)
      jsx: 'automatic'
    }
  },
  site: 'https://shelterprotocol.net'
});
