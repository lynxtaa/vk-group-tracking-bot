/**
 * Formats VK links which look like this `[https://example.com|some text]`
 * or like this `[id123|some text]` to `some text (https://...)`
 */
export function formatVKLinks(text: string): string {
	return text.replace(
		/\[(?<link>(http(s)?:\/\/.+?)|([\d\w]+?))\|(?<text>.+?)\]/g,
		(...args) => {
			const { link, text }: { link: string; text: string } = args[args.length - 1]
			return `${text} (${link.startsWith('http') ? link : `https://vk.com/${link}`})`
		},
	)
}
