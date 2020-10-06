import { TelegrafContext } from 'telegraf/typings/context'

import { Bot } from './Bot'
import { debug } from './commands/debug'
import { del } from './commands/del'
import { help } from './commands/help'
import { latest } from './commands/latest'
import { list } from './commands/list'
import { groupLink } from './text/groupLink'
import { wrapInCodeBlock } from './utils/wrapInCodeBlock'

export function createBot({
	token,
	isDev,
}: {
	isDev: boolean
	token: string
}): Bot<TelegrafContext> {
	const bot = new Bot(token)

	bot.start(help)

	bot.catch((err: Error, ctx: TelegrafContext) => {
		// eslint-disable-next-line no-console
		console.error(`Ooops, encountered an error for ${ctx.updateType}`, err)

		if (!isDev) {
			return ctx.reply('Ой, ошибка...')
		}

		return ctx.replyWithMarkdown(wrapInCodeBlock(err.stack || err.message))
	})

	bot.help(help)

	bot.command('list', list)

	bot.hears(/^http(s)?:/, groupLink)

	bot.command('/latest', latest(bot))

	bot.command('del', del)

	if (isDev) {
		bot.command('debug', debug)
	}

	return bot
}
