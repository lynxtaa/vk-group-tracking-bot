import QuickLRU from 'quick-lru'
import { Telegraf } from 'telegraf'
import { TelegrafContext } from 'telegraf/typings/context'
import { TelegrafOptions } from 'telegraf/typings/telegraf'
import { MessageMedia, ExtraMediaGroup, Message } from 'telegraf/typings/telegram-types'

export class BotWithCache<T extends TelegrafContext> extends Telegraf<T> {
	fileCache: QuickLRU<string, string>

	constructor(token: string, options?: TelegrafOptions) {
		super(token, options)
		this.fileCache = new QuickLRU<string, string>({ maxSize: 1000 })
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

		for (let i = 0; i < media.length; i++) {
			const url = media[i].media
			const fileId = messages[i]?.photo?.[0].file_id
			if (fileId) {
				this.fileCache.set(url, fileId)
			}
		}

		return messages
	}
}
