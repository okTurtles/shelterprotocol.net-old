import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import mdx from '@astrojs/mdx';
import starlight from "@astrojs/starlight";

import { GITHUB_EDIT_URL, COMMUNITY_INVITE_URL } from './src/consts'

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
				baseUrl: GITHUB_EDIT_URL
			},
			logo: {
				src: './public/images/logo.svg'
			},
			locales: {
				en: {
					label: 'English'
				}
			},
			lastUpdated: true,
			customCss: [
				'./src/styles/override-main.scss'
			],
			sidebar: [
				// A group of links labelled "Guides".
				{
					label: 'Overview',
					items: [
						{ label: 'Introduction', link: '/en/introduction' },
						{ label: 'Key Concepts', link: '/en/key-concepts' },
						{ label: 'Multiple Devices', link: '/en/multi-device' },
						{ label: 'Message Processing', link: '/en/message-processing' },
						{ label: 'Federation', link: '/en/federation' },
						{ label: 'Security', link: '/en/security' },
						{ label: 'Implementations', link: '/en/implementations' }
					]
				},
				{
					label: 'Examples',
					items: [
						{ label: 'Identity Contract', link: '/en/identity-contract' },
						{ label: 'Real-world Apps', link: '/en/usecases' }
					]
				},
				{
					label: 'Reference',
					items: [
						{ label: 'SPMessage', link: '/en/spmessage' },
						{ label: 'Opcodes', link: '/en/opcodes' },
						{ label: 'Server API', link: '/en/server-api' },
						{ label: 'Invite Keys', link: '/en/invite-keys' },
						{ label: 'Contract Manifests', link: '/en/contract-manifests' },
						{ label: 'State Snapshots', link: '/en/state-snapshots' },
						{ label: 'ZKPP', link: '/en/zkpp' }
					]
				},
				{
					label: 'About',
					items: [
						{ label: 'Authors', link: '/en/authors' },
						{ label: 'History', link: '/en/history' }
					]
				},
				{ 
					label: 'Join our community',
					link: COMMUNITY_INVITE_URL,
					attrs: { target: '_blank' },
					badge: { text: 'Note', variant: 'note' }
				}
			],
			components: {
				Search: './src/components/search/Search.astro',
				Head: './src/components/head-override/Head.astro'
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
