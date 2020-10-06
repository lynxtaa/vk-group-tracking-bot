import QuickLRU from 'quick-lru'
import { Telegraf } from 'telegraf'
import { TelegrafContext } from 'telegraf/typings/context'
import { TelegrafOptions } from 'telegraf/typings/telegraf'
import { MessageMedia, ExtraMediaGroup, Message } from 'telegraf/typings/telegram-types'
import { StructType } from 'superstruct'
import { WallPost } from '../structs'
import { parseWallPost } from './parseWallPost'
import PQueue from 'p-queue'
import ms from 'ms'
import { zip } from 'lodash'

export class BotWithCache<T extends TelegrafContext> extends Telegraf<T> {
	fileCache: QuickLRU<string, string>
	queue: PQueue

	constructor(token: string, options?: TelegrafOptions) {
		super(token, options)

		this.fileCache = new QuickLRU<string, string>({ maxSize: 1000 })

		// https://core.telegram.org/bots/faq#my-bot-is-hitting-limits-how-do-i-avoid-this
		this.queue = new PQueue({ interval: ms('1s'), intervalCap: 3 })
	}

	async sendCachedMediaGroup(
		chatId: number | string,
		media: (Omit<MessageMedia, 'media'> & { media: string })[],
		extra?: ExtraMediaGroup,
	): Promise<Message[]> {
		const messages = await this.telegram.sendMediaGroup(
			chatId,
			media.map((file) => {
				const fileId = this.fileCache.get(file.media)
				return fileId ? { ...file, media: fileId } : file
			}),
			extra,
		)

		for (const [file, message] of zip(media, messages)) {
			const fileId = message?.photo?.[0]?.file_id
			if (file && fileId) {
				this.fileCache.set(file.media, fileId)
			}
		}

		return messages
	}

	async sendPostToChat({
		chatId,
		groupName,
		post,
	}: {
		chatId: string
		groupName: string
		post: StructType<typeof WallPost>
	}): Promise<void> {
		return this.queue.add(async () => {
			const { text, photos, videos, repost } = await parseWallPost(groupName, post)

			await this.telegram.sendMessage(chatId, text, { disable_web_page_preview: true })

			if (photos.length > 0) {
				await this.sendCachedMediaGroup(chatId, photos)
			}

			for (const videoLink of videos) {
				await this.telegram.sendMessage(chatId, videoLink)
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
