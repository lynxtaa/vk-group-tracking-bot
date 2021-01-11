import { Bot, BotContext } from '../Bot'
import { getAliasFromURL } from '../utils/getAliasFromURL'
import { vkClient } from '../vkClient'

/** возвращает последний пост указанной группы */
export function latest(bot: Bot) {
	return async function (ctx: BotContext): Promise<unknown> {
		if (!ctx.chat || !ctx.message || !('text' in ctx.message)) {
			return ctx.reply('?')
		}

		const [, url] = ctx.message.text.split(' ')
		const alias = getAliasFromURL(url)

		let info: { id: number; name: string }

		try {
			const infos = await vkClient.getGroupById({ group_id: alias })
			info = infos[0]
		} catch (err) {
			return ctx.reply(`Группа закрытая либо не существует`)
		}

		const ownerID = 0 - info.id

		const posts = await vkClient.getWall({
			owner_id: ownerID,
			count: 5,
			offset: 0,
		})

		const [latestPost] = posts.items.filter(
			(post) => !post.marked_as_ads && !post.is_pinned,
		)

		if (latestPost) {
			await bot.sendPostToChat({
				chatId: String(ctx.chat.id),
				post: latestPost,
				groupName: info.name,
			})
		} else {
			await ctx.reply('Новости не найдены')
		}
	}
}
