import { formatVKLinks } from './formatVKLinks'

it('do nothing for regular text', () => {
	const text = 'Hello'
	expect(formatVKLinks(text)).toBe(text)
})

it('formats external links', () => {
	const text = 'Check out [http://example.com|this] and [https://google.com|that] posts!'
	expect(formatVKLinks(text)).toBe(
		`Check out this (http://example.com) and that (https://google.com) posts!`,
	)
})

it('formats inner links', () => {
	const text = 'Check out [id123|this user] and [club1337|that] group!'
	expect(formatVKLinks(text)).toBe(
		`Check out this user (https://vk.com/id123) and that (https://vk.com/club1337) group!`,
	)
})
