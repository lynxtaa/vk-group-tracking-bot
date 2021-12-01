import { Group } from '../models/Group.js'
import { server, rest } from '../mswServer.js'
import { generatePost } from '../test-utils/test-utils.js'

import { getNewPosts } from './getNewPosts.js'

it('returns latest non-ad post if no last post saved', async () => {
	const posts = [
		generatePost({ id: 11, marked_as_ads: 1 }),
		generatePost({ id: 10, marked_as_ads: 0 }),
		generatePost({ id: 9, marked_as_ads: 0 }),
	]

	server.use(
		rest.get('https://api.vk.com/method/wall.get*', (req, res, ctx) =>
			res(
				ctx.json({
					response: { count: posts.length, items: posts },
				}),
			),
		),
	)

	const newPosts = await getNewPosts({
		ownerID: 10,
		alias: 'badnews',
		name: 'плохие новости',
		createdAt: new Date(),
	} as Group)

	expect(newPosts).toEqual([posts[1]])
})

it('returns no posts if latest post is already saved', async () => {
	const posts = [
		generatePost({ id: 11, marked_as_ads: 1 }),
		generatePost({ id: 10, marked_as_ads: 0 }),
		generatePost({ id: 9, marked_as_ads: 0 }),
	]

	server.use(
		rest.get('https://api.vk.com/method/wall.get*', (req, res, ctx) =>
			res(
				ctx.json({
					response: { count: posts.length, items: posts },
				}),
			),
		),
	)

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

	server.use(
		rest.get('https://api.vk.com/method/wall.get*', (req, res, ctx) =>
			res(
				ctx.json({
					response: { count: posts.length, items: posts },
				}),
			),
		),
	)

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
	server.use(
		rest.get('https://api.vk.com/method/wall.get*', (req, res, ctx) =>
			res(
				ctx.json({
					response: { count: 0, items: [] },
				}),
			),
		),
	)

	const newPosts = await getNewPosts({
		ownerID: 10,
		alias: 'badnews',
		name: 'плохие новости',
		createdAt: new Date(),
		lastPost: { postId: 8, checkedAt: new Date(), createdAt: new Date() },
	} as Group)

	expect(newPosts).toEqual([])
})
