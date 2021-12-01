import { BotContext } from '../Bot.js'
import { getUserGroups } from '../utils/getUserGroups.js'

/** список отслеживаемых пользователем групп */
export async function list(ctx: BotContext): Promise<unknown> {
	if (!ctx.chat) {
		return ctx.reply('?')
	}

	const groups = await getUserGroups(String(ctx.chat.id))

	if (groups.length === 0) {
		return ctx.reply('Подписок нет')
	}

	return ctx.reply(
		[
			'Твои подписки:',
			...groups.map(group => `• ${group.name} (https://vk.com/${group.alias})`),
		].join('\n'),
		{ disable_web_page_preview: true },
	)
}
