import { URL } from 'url'

export function getAliasFromURL(url: string): string {
	const { pathname } = new URL(url)
	return pathname.replace('/', '')
}
