import { groupBy } from 'lodash'

import { Bot } from './Bot'
import { ChatModel } from './models/Chat'
import { GroupModel } from './models/Group'
import { getNewPosts } from './utils/getNewPosts'

const MAX_FAILED_SENDS = 100

export async function checkUpdates(bot: Bot): Promise<void> {
	const chatsToCheck = await ChatModel.find({
		groups: { $exists: true, $ne: [] },
		failedSends: { $lt: MAX_FAILED_SENDS },
	})

	const byGroupId = groupBy(
		chatsToCheck.flatMap((chat) => chat.groups.map((groupId) => ({ chat, groupId }))),
		(el) => el.groupId,
	)

	const groups = await GroupModel.find().where('_id').in(Object.keys(byGroupId))

	const checkResults = await Promise.allSettled(
		groups.map(async (group) => {
			const newPosts = await getNewPosts(group)

			if (newPosts[0]) {
				group.lastPost = {
					postId: newPosts[0].id,
					checkedAt: new Date(),
					createdAt: new Date(),
				}
				await group.save()
			} else if (group.lastPost) {
				group.lastPost.checkedAt = new Date()
				await group.save()
			}

			return newPosts
		}),
	)

	for (let i = 0; i < checkResults.length; i++) {
		const result = checkResults[i]
		const group = groups[i]

		if (result.status === 'rejected') {
			// eslint-disable-next-line no-console
			console.error(`Error in ${group.name}: ${result.reason}`)
			continue
		}

		for (const post of result.value) {
			for (const { chat } of byGroupId[String(group._id)]) {
				try {
					await bot.sendPostToChat({ chatId: chat.chatId, post, groupName: group.name })
					if (chat.failedSends > 0) {
						chat.failedSends = 0
						await chat.save()
					}
				} catch (err) {
					// eslint-disable-next-line no-console
					console.error(
						`Error in sending post ${post.id} to chat ${chat.chatId} (${err})`,
					)
					chat.failedSends++
					await chat.save()
				}
			}
		}
	}
}
