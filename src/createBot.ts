import { TelegrafContext } from 'telegraf/typings/context'

import { Bot } from './Bot'
import * as commands from './commands'
import { wrapInCodeBlock } from './utils/wrapInCodeBlock'

export function createBot({
	token,
	isDev,
}: {
	isDev: boolean
	token: string
}): Bot<TelegrafContext> {
	const bot = new Bot(token)

	bot.start(commands.help)

	bot.catch((err: Error, ctx: TelegrafContext) => {
		// eslint-disable-next-line no-console
		console.error(`Ooops, encountered an error for ${ctx.updateType}`, err)

		if (!isDev) {
			return ctx.reply('Ой, ошибка...')
		}

		return ctx.replyWithMarkdown(wrapInCodeBlock(err.stack || err.message))
	})

	bot.help(commands.help)

	bot.command('list', commands.list)

	bot.hears(/^http(s)?:/, commands.add)

	bot.command('/latest', commands.latest(bot))

	bot.command('del', commands.del)

	if (isDev) {
		bot.command('debug', commands.debug)
	}

	return bot
}
