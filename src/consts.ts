export const SITE = {
	title: 'Shelter Protocol',
	description: 'Your website description.',
	defaultLanguage: 'en-US',
} as const

export const OPEN_GRAPH = {
	image: {
		src: 'https://github.com/withastro/astro/blob/main/.github/assets/banner.png?raw=true',
		alt: ''
	},
	twitter: 'astrodotbuild'
}

export const KNOWN_LANGUAGES = {
	English: 'en'
} as const
export const KNOWN_LANGUAGE_CODES = Object.values(KNOWN_LANGUAGES)

export const GITHUB_EDIT_URL = 'https://github.com/withastro/astro/tree/main/examples/docs'

export const COMMUNITY_INVITE_URL = 'https://join.slack.com/t/okturtles/shared_invite/zt-10jmpfgxj-tXQ1MKW7t8qqdyY6fB7uyQ'

// See "Algolia" section of the README for more information.
export const ALGOLIA = {
	indexName: 'XXXXXXXXXX',
	appId: 'XXXXXXXXXX',
	apiKey: 'XXXXXXXXXX'
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
			{ text: 'Opcodes', link: 'en/opcodes-overview' },
			{ text: 'Salt Retrieval', link: 'en/salt-overview' },
			{ text: 'Key-value Store', link: 'en/key-value-store' },
			{ text: 'Usernames', link: 'en/usernames' },
			{ text: 'Real-world Apps', link: 'en/usecases' }
		],
		'Reference': [
			{ text: 'SPMessage', link: 'en/spmessage' },
			{ text: 'Opcodes', link: 'en/opcodes-reference' }
		]
	}
}
