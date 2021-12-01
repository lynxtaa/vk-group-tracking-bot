import { BotContext } from '../Bot.js'
import { vkClient } from '../vkClient.js'

/** включение/выключение отладки запросов */
export function debug(ctx: BotContext): Promise<unknown> {
	const debug = vkClient.toggleDebug()
	return ctx.reply(debug ? 'Debug enabled' : 'Debug disabled')
}
