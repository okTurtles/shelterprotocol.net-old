export const SITE = {
	title: 'Shelter Protocol',
	description: 'A protocol for creating end-to-end encrypted, federated, user-friendly web applications.',
	defaultLanguage: 'en-US',
} as const


// TODO: update all of these URLs
export const OPEN_GRAPH = {
	image: {
		// src: 'https://github.com/withastro/astro/blob/main/.github/assets/banner.png?raw=true',
		src: '/favicon.svg',
		alt: 'Shelter protocol logo'
	},
	twitter: 'astrodotbuild'
}

export const KNOWN_LANGUAGES = {
	English: 'en'
} as const
export const KNOWN_LANGUAGE_CODES = Object.values(KNOWN_LANGUAGES)

export const GITHUB_EDIT_URL = 'https://github.com/okturtles/shelterprotocol.net/tree/master'

export const COMMUNITY_INVITE_URL = 'https://join.slack.com/t/okturtles/shared_invite/zt-10jmpfgxj-tXQ1MKW7t8qqdyY6fB7uyQ'

export const STORK = {
	registrationName: 'shelterprotocol'
}

export type Sidebar = Record<
	(typeof KNOWN_LANGUAGE_CODES)[number],
	Record<string, { text: string; link: string }[]>
>
export const SIDEBAR: Sidebar = {
	en: {
		'Overview': [
			{ text: 'Introduction', link: 'en/introduction' },
			{ text: 'Key Concepts', link: 'en/key-concepts' },
			{ text: 'Multiple Devices', link: 'en/multi-device' },
			{ text: 'Message Processing', link: 'en/message-processing' },
			{ text: 'Federation', link: 'en/federation' },
			{ text: 'Security', link: 'en/security' },
			{ text: 'Implementations', link: 'en/implementations' },
		],
		'Examples': [
			{ text: 'Identity Contract', link: 'en/identity-contract' },
			{ text: 'Real-world Apps', link: 'en/usecases' }
		],
		'Reference': [
			{ text: 'SPMessage', link: 'en/spmessage' },
			{ text: 'Opcodes', link: 'en/opcodes' },
			{ text: 'Server API', link: 'en/server-api' },
			{ text: 'Invite Keys', link: 'en/invite-keys' },
			{ text: 'Contract Manifests', link: 'en/contract-manifests' },
			{ text: 'State Snapshots', link: 'en/state-snapshots' },
			{ text: 'ZKPP', link: 'en/zkpp' },
		],
		'About': [
			{ text: 'Authors', link: 'en/authors' },
			{ text: 'History', link: 'en/history' }
		]
	}
}
