import { Scenes, Markup } from 'telegraf'

import { BotContext } from '../Bot.js'
import { ChatModel } from '../models/Chat.js'
import { GroupModel } from '../models/Group.js'
import { getUserGroups } from '../utils/getUserGroups.js'

export const delGroupScene = new Scenes.BaseScene<BotContext>('delGroupScene')

delGroupScene.enter(async ctx => {
	if (!ctx.chat || !ctx.message) {
		return ctx.reply('?')
	}

	const groups = await getUserGroups(String(ctx.chat.id))

	if (groups.length === 0) {
		await ctx.reply('Нет сохраненных групп')
		return ctx.scene.leave()
	}

	return ctx.reply(
		'Выберите группу, от которой хотите отписаться',
		Markup.inlineKeyboard(
			groups.map(group => Markup.button.callback(group.name, String(group._id))),
			{ columns: 1 },
		),
	)
})

delGroupScene.action(/.+/, async ctx => {
	if (!ctx.match || !ctx.chat) {
		return ctx.reply('?')
	}

	const [_id] = ctx.match

	const savedChat = await ChatModel.findOne({ chatId: String(ctx.chat.id) })
	const savedGroup = await GroupModel.findById(_id)

	if (!savedChat || !savedGroup) {
		await ctx.reply(`Нет подписки на эту группу`)
		return ctx.scene.leave()
	}

	const updatedGroups = savedChat.groups.filter(
		id => String(id) !== String(savedGroup._id),
	)

	if (updatedGroups.length === savedChat.groups.length) {
		await ctx.reply(`Нет подписки на эту группу`)
		return ctx.scene.leave()
	}

	savedChat.groups = updatedGroups

	await savedChat.save()

	await ctx.editMessageText(`Группа "${savedGroup.name}" удалена из списка отслеживаемых`)

	const chatsWithSameGroup = await ChatModel.find({ groups: String(savedGroup._id) })

	if (chatsWithSameGroup.length === 0) {
		await savedGroup.deleteOne()
	}

	return ctx.scene.leave()
})
