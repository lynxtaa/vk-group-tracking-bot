import { TelegrafContext } from 'telegraf/typings/context'

import { ChatModel } from '../models/Chat'
import { Group } from '../models/Group'

/** список отслеживаемых пользователем групп */
export async function list(ctx: TelegrafContext): Promise<unknown> {
	if (!ctx.chat) {
		return ctx.reply('?')
	}

	const chat = await ChatModel.findOne({ chatId: String(ctx.chat.id) }).populate('groups')

	if (!chat || chat.groups.length === 0) {
		return ctx.reply('Подписок нет')
	}

	const groups = (chat.groups as unknown) as Group[]

	return ctx.reply(
		[
			'Твои подписки:',
			...groups.map((group) => `• ${group.name} (https://vk.com/${group.alias})`).sort(),
		].join('\n'),
		{ disable_web_page_preview: true },
	)
}
