import { Group } from '../models/Group'
import { generatePost } from '../test-utils'
import { vkClient, VKClient } from '../vkClient'

import { getNewPosts } from './getNewPosts'

jest.mock('../vkClient', () => ({
	vkClient: { getWall: jest.fn() },
}))

const mockGetWall = vkClient.getWall as jest.Mock<
	ReturnType<VKClient['getWall']>,
	Parameters<VKClient['getWall']>
>

it('returns latest non-ad post if no last post saved', async () => {
	const posts = [
		generatePost({ id: 11, marked_as_ads: 1 }),
		generatePost({ id: 10, marked_as_ads: 0 }),
		generatePost({ id: 9, marked_as_ads: 0 }),
	]

	mockGetWall.mockResolvedValue({
		count: posts.length,
		items: posts,
	})

	const newPosts = await getNewPosts({
		ownerID: 10,
		alias: 'badnews',
		name: 'плохие новости',
		createdAt: new Date(),
	} as Group)

	expect(newPosts).toEqual([posts[1]])
	expect(mockGetWall).toHaveBeenCalledWith({
		owner_id: 10,
		count: expect.any(Number),
		offset: expect.any(Number),
	})
})

it('returns no posts if latest post is already saved', async () => {
	const posts = [
		generatePost({ id: 11, marked_as_ads: 1 }),
		generatePost({ id: 10, marked_as_ads: 0 }),
		generatePost({ id: 9, marked_as_ads: 0 }),
	]

	mockGetWall.mockResolvedValue({ count: posts.length, items: posts })

	const newPosts = await getNewPosts({
		ownerID: 10,
		alias: 'badnews',
		name: 'плохие новости',
		createdAt: new Date(),
		lastPost: { postId: 10, checkedAt: new Date(), createdAt: new Date() },
	} as Group)

	expect(newPosts).toEqual([])
})

it('returns new posts after saved post', async () => {
	const posts = [
		generatePost({ id: 11, marked_as_ads: 1 }),
		generatePost({ id: 10, marked_as_ads: 0 }),
		generatePost({ id: 9, marked_as_ads: 0 }),
		generatePost({ id: 8, marked_as_ads: 0 }),
		generatePost({ id: 7, marked_as_ads: 0 }),
	]

	mockGetWall.mockResolvedValue({ count: posts.length, items: posts })

	const newPosts = await getNewPosts({
		ownerID: 10,
		alias: 'badnews',
		name: 'плохие новости',
		createdAt: new Date(),
		lastPost: { postId: 8, checkedAt: new Date(), createdAt: new Date() },
	} as Group)

	expect(newPosts).toEqual([posts[1], posts[2]])
})

it('returns no posts if no posts in group', async () => {
	mockGetWall.mockResolvedValue({ count: 0, items: [] })

	const newPosts = await getNewPosts({
		ownerID: 10,
		alias: 'badnews',
		name: 'плохие новости',
		createdAt: new Date(),
		lastPost: { postId: 8, checkedAt: new Date(), createdAt: new Date() },
	} as Group)

	expect(newPosts).toEqual([])
})
