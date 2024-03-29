import zip from 'lodash/zip.js'
import ms from 'ms'
import PQueue from 'p-queue'
import QuickLRU from 'quick-lru'
import { Infer } from 'superstruct'
import { Telegraf, Scenes } from 'telegraf'
import { InputMediaPhoto, Message } from 'telegraf/typings/core/types/typegram'
import { ExtraMediaGroup } from 'telegraf/typings/telegram-types'

import { parseWallPost } from './utils/parseWallPost.js'
import { WallPost } from './utils/structs.js'

export type BotContext = Scenes.SceneContext

export class Bot extends Telegraf<BotContext> {
	fileCache: QuickLRU<string, string>
	queue: PQueue

	constructor(token: string, options?: Telegraf.Options<BotContext>) {
		super(token, options)

		this.fileCache = new QuickLRU<string, string>({ maxSize: 1000 })

		// https://core.telegram.org/bots/faq#my-bot-is-hitting-limits-how-do-i-avoid-this
		this.queue = new PQueue({ interval: ms('1s'), intervalCap: 3 })
	}

	/** посылает media group, переиспользуя file_id для уже посланных файлов */
	async sendCachedMediaGroup(
		chatId: number | string,
		media: (Omit<InputMediaPhoto, 'media'> & { media: string })[],
		extra?: ExtraMediaGroup,
	): Promise<Message[]> {
		const messages = await this.telegram.sendMediaGroup(
			chatId,
			media.map(file => {
				const fileId = this.fileCache.get(file.media)
				return fileId ? { ...file, media: fileId } : file
			}),
			extra,
		)

		for (const [file, message] of zip(media, messages)) {
			if (message && 'photo' in message) {
				const fileId = message.photo[0]?.file_id
				if (file && fileId) {
					this.fileCache.set(file.media, fileId)
				}
			}
		}

		return messages
	}

	/** посылает пост VK в чат */
	sendPostToChat({
		chatId,
		groupName,
		post,
	}: {
		chatId: string
		groupName: string
		post: Infer<typeof WallPost>
	}): Promise<void> {
		return this.queue.add(async () => {
			const { text, photos, links, videos, repost } = await parseWallPost(groupName, post)

			// Если пост короткий и у первой фотографии нет подписи,
			// сделаем текст поста подписью для первой фотографии
			if (text.length < 1024 && photos[0] && !photos[0].caption) {
				const [firstPhoto, ...rest] = photos

				await this.sendCachedMediaGroup(chatId, [
					{ ...firstPhoto, caption: text },
					...rest,
				])
			} else {
				await this.telegram.sendMessage(chatId, text, { disable_web_page_preview: true })

				if (photos.length > 0) {
					await this.sendCachedMediaGroup(chatId, photos)
				}
			}

			for (const videoLink of videos) {
				await this.telegram.sendMessage(chatId, videoLink)
			}

			for (const link of links) {
				await this.telegram.sendMessage(chatId, link)
			}

			if (repost) {
				const { text, photos, videos } = repost

				await this.telegram.sendMessage(chatId, `--- REPOST ---\n\n${text}`, {
					disable_web_page_preview: true,
				})

				if (photos.length > 0) {
					await this.sendCachedMediaGroup(chatId, photos)
				}

				for (const videoLink of videos) {
					await this.telegram.sendMessage(chatId, videoLink)
				}
			}
		})
	}
}
