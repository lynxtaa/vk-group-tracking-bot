import 'dotenv-safe/config'

import { URL } from 'url'
import { Telegraf } from 'telegraf'
import { TelegrafContext } from 'telegraf/typings/context'

import { vkClient } from './vkClient'
import { wrapInCodeBlock } from './utils/wrapInCodeBlock'
import { parseWallPost } from './utils/parseWallPost'

async function main() {
	const bot = new Telegraf(process.env.BOT_TOKEN!)

	bot.start((ctx) => ctx.reply('Привет!'))

	bot.catch((err: Error, ctx: TelegrafContext) => {
		// eslint-disable-next-line no-console
		console.error(`Ooops, encountered an error for ${ctx.updateType}`, err)

		if (process.env.NODE_ENV === 'production') {
			return ctx.reply('Ой, ошибка...')
		}

		return ctx.replyWithMarkdown(wrapInCodeBlock(err.stack || err.message))
	})

	bot.hears(/http(s)?:/, async (ctx) => {
		const link = ctx.message?.text

		if (!link) {
			return ctx.reply('?')
		}

		const { pathname } = new URL(link)
		const groupId = pathname.replace('/', '')

		const [info] = await vkClient.getGroupById({ group_id: groupId })

		const ownerId = 0 - info.id

		const posts = await vkClient.getWall({
			owner_id: ownerId,
			count: 5,
			offset: 0,
		})

		const postsWithoutAds = posts.items.filter(
			(post) => !post.marked_as_ads && !post.is_pinned,
		)

		const [latestPost] = postsWithoutAds

		if (!latestPost) {
			return ctx.reply('Нет записей')
		}

		const { text, photos, videos } = parseWallPost(info.name, latestPost)

		await ctx.reply(text, { disable_web_page_preview: true })

		if (photos.length > 0) {
			await ctx.replyWithMediaGroup(photos)
		}

		for (const videoLink of videos) {
			await ctx.reply(videoLink)
		}

		const repost = latestPost.copy_history?.[0]

		if (repost) {
			const [info] = await vkClient.getGroupById({
				group_id: String(0 - repost.owner_id),
			})

			const { text, photos, videos } = parseWallPost(info.name, repost)

			await ctx.reply(`--- REPOST ---\n\n${text}`, { disable_web_page_preview: true })

			if (photos.length > 0) {
				await ctx.replyWithMediaGroup(photos)
			}

			for (const videoLink of videos) {
				await ctx.reply(videoLink)
			}
		}
	})

	if (process.env.NODE_ENV !== 'production') {
		bot.command('debug', (ctx) => {
			const debug = vkClient.toggleDebug()
			return ctx.reply(debug ? 'Debug enabled' : 'Debug disabled')
		})
	}

	await bot.launch()

	// eslint-disable-next-line no-console
	console.log('Bot launched...')
}

main()

process.on('unhandledRejection', (err) => {
	throw err
})
