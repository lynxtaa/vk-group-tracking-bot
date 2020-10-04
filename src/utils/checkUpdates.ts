import { Group } from '../models/Group'
import { vkClient } from '../vkClient'
import { parseWallPost } from './parseWallPost'

type ParsedPost = ReturnType<typeof parseWallPost> & {
	repost?: ReturnType<typeof parseWallPost>
}

type Result = { groupId: string; post: ParsedPost } | { groupId: string; error: Error }

export async function checkUpdates(groups: Group[]): Promise<Result[]> {
	const results: Result[] = []

	for (const group of groups) {
		try {
			const posts = await vkClient.getWall({
				owner_id: group.ownerID,
				count: 5,
				offset: 0,
			})

			const postsWithoutAds = posts.items.filter(
				(post) => !post.marked_as_ads && !post.is_pinned,
			)

			const [latestPost] = postsWithoutAds

			if (!latestPost) {
				continue
			}

			if (group.lastPost?.postId === latestPost.id) {
				group.lastPost.checkedAt = new Date()
			} else {
				const post: ParsedPost = parseWallPost(group.name, latestPost)

				const repost = latestPost.copy_history?.[0]

				if (repost) {
					const [info] = await vkClient.getGroupById({
						group_id: String(0 - repost.owner_id),
					})

					post.repost = parseWallPost(info.name, repost)
				}

				results.push({ groupId: group._id, post })

				group.lastPost = {
					postId: latestPost.id,
					checkedAt: new Date(),
					createdAt: new Date(),
				}
			}
		} catch (error) {
			results.push({ groupId: group._id, error })
		}

		await group.save()
	}

	return results
}
