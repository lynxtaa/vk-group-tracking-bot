import { Infer } from 'superstruct'

import { Group } from '../models/Group'
import { vkClient } from '../vkClient'

import { WallPost } from './structs'

/** Возвращает новые посты в группе */
export async function getNewPosts(group: Group): Promise<Infer<typeof WallPost>[]> {
	const posts = await vkClient.getWall({
		owner_id: group.ownerID,
		count: 10,
		offset: 0,
	})

	const first5PostsWithoutAds = posts.items
		.filter((post) => !post.marked_as_ads && !post.is_pinned)
		.slice(0, 5)

	const newPosts = group.lastPost
		? getPostsAfterId(first5PostsWithoutAds, group.lastPost.postId)
		: first5PostsWithoutAds[0]
		? [first5PostsWithoutAds[0]]
		: []

	return newPosts
}

function getPostsAfterId(posts: Infer<typeof WallPost>[], afterPostId: number) {
	const i = posts.findIndex((el) => el.id === afterPostId)
	const newPosts = i === -1 ? posts : posts.slice(0, i)
	return newPosts
}
