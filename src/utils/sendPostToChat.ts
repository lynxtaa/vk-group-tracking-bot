import { StructType } from 'superstruct'
import Telegraf from 'telegraf'
import { TelegrafContext } from 'telegraf/typings/context'
import { WallPost } from '../structs'
import { parseWallPost } from './parseWallPost'

export async function sendPostToChat<T extends TelegrafContext>(
	bot: Telegraf<T>,
	{
		chatId,
		groupName,
		post,
	}: {
		chatId: string
		groupName: string
		post: StructType<typeof WallPost>
	},
): Promise<void> {
	const { text, photos, videos, repost } = await parseWallPost(groupName, post)

	await bot.telegram.sendMessage(chatId, text, { disable_web_page_preview: true })

	if (photos.length > 0) {
		await bot.telegram.sendMediaGroup(chatId, photos)
	}

	for (const videoLink of videos) {
		await bot.telegram.sendMessage(chatId, videoLink)
	}

	if (repost) {
		const { text, photos, videos } = repost

		await bot.telegram.sendMessage(chatId, `--- REPOST ---\n\n${text}`, {
			disable_web_page_preview: true,
		})

		if (photos.length > 0) {
			await bot.telegram.sendMediaGroup(chatId, photos)
		}

		for (const videoLink of videos) {
			await bot.telegram.sendMessage(chatId, videoLink)
		}
	}
}
