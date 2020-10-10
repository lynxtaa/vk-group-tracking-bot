import { TelegrafContext } from 'telegraf/typings/context'

import { ChatModel } from '../models/Chat'
import { GroupModel } from '../models/Group'
import { getAliasFromURL } from '../utils/getAliasFromURL'

/** удаление отслеживания группы */
export async function del<T extends TelegrafContext>(ctx: T): Promise<unknown> {
	if (!ctx.chat || !ctx.message?.text) {
		return ctx.reply('?')
	}

	const [, url] = ctx.message.text.split(' ')
	const alias = getAliasFromURL(url)

	const savedChat = await ChatModel.findOne({ chatId: String(ctx.chat.id) })
	const savedGroup = await GroupModel.findOne({ alias })

	if (!savedChat || !savedGroup) {
		return ctx.reply(`Нет подписки на эту группу`)
	}

	const updatedGroups = savedChat.groups.filter(
		(id) => String(id) !== String(savedGroup._id),
	)

	if (updatedGroups.length === savedChat.groups.length) {
		return ctx.reply(`Нет подписки на эту группу`)
	}

	savedChat.groups = updatedGroups

	await savedChat.save()

	await ctx.reply(`Группа "${savedGroup.name}" удалена из списка отслеживаемых`)

	const chatsWithSameGroup = await ChatModel.find({ groups: savedGroup._id })

	if (chatsWithSameGroup.length === 0) {
		await savedGroup.deleteOne()
	}
}
