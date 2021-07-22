import { getAliasFromURL } from './getAliasFromURL'

it('returns path from url', () => {
	expect(getAliasFromURL('http://vk.com/club11233')).toBe('club11233')
	expect(getAliasFromURL('https://m.vk.com/club11233')).toBe('club11233')
	expect(getAliasFromURL('https://vk.com/public11233')).toBe('club11233')
	expect(getAliasFromURL('https://vk.com/public-group')).toBe('public-group')
})
