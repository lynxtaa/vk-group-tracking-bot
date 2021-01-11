import { BotContext } from '../Bot'
import { vkClient } from '../vkClient'

/** включение/выключение отладки запросов */
export function debug(ctx: BotContext): Promise<unknown> {
	const debug = vkClient.toggleDebug()
	return ctx.reply(debug ? 'Debug enabled' : 'Debug disabled')
}
