import { URL } from 'url'

/**
 * Возвращает короткое имя группы из переданного URL
 *
 * @example
 * ```js
 * getAliasFromURL('https://vk.com/club123') // club123
 * ```
 */
export function getAliasFromURL(url: string): string {
	const { pathname } = new URL(url)
	return pathname.replace('/', '').replace(/^public(\d+)/, 'club$1')
}
