import { TelegrafContext } from 'telegraf/typings/context'

import { vkClient } from '../vkClient'

export function debug<T extends TelegrafContext>(ctx: T): Promise<unknown> {
	const debug = vkClient.toggleDebug()
	return ctx.reply(debug ? 'Debug enabled' : 'Debug disabled')
}
