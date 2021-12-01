import { session, Scenes } from 'telegraf'

import { Bot } from './Bot.js'
import * as commands from './commands/index.js'
import { delGroupScene } from './scenes/delGroupScene.js'
import { wrapInCodeBlock } from './utils/wrapInCodeBlock.js'

export function createBot({ token, isDev }: { isDev: boolean; token: string }): Bot {
	const bot = new Bot(token)
	const stage = new Scenes.Stage([delGroupScene], { ttl: 20 })

	bot.use(session())

	bot.use(stage.middleware())

	bot.start(commands.help)

	bot.catch(async (err, ctx) => {
		// eslint-disable-next-line no-console
		console.error(`Ooops, encountered an error for ${ctx.updateType}`, err)

		if (isDev) {
			await ctx.replyWithMarkdown(
				wrapInCodeBlock(err instanceof Error ? err.stack || err.message : String(err)),
			)
		} else {
			await ctx.reply('Ой, ошибка...')
		}
	})

	bot.help(commands.help)

	bot.command('list', commands.list)

	bot.command('del', ctx => ctx.scene.enter(delGroupScene.id))

	bot.hears(/^http(s)?:/, commands.add)

	bot.command('latest', commands.latest(bot))

	if (isDev) {
		bot.command('debug', commands.debug)
	}

	return bot
}
