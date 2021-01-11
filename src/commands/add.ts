import { BotContext } from '../Bot'
import { ChatModel } from '../models/Chat'
import { GroupModel } from '../models/Group'
import { getAliasFromURL } from '../utils/getAliasFromURL'
import { vkClient } from '../vkClient'

/** добавление отслеживания группы */
export async function add(ctx: BotContext): Promise<unknown> {
	if (!ctx.message || !('text' in ctx.message) || !ctx.chat) {
		return ctx.reply('?')
	}

	const alias = getAliasFromURL(ctx.message.text)

	let info: { id: number; name: string }

	try {
		const infos = await vkClient.getGroupById({ group_id: alias })
		info = infos[0]
	} catch (err) {
		return ctx.reply(`Группа закрытая либо не существует`)
	}

	const ownerID = 0 - info.id

	const savedGroup =
		(await GroupModel.findOne({ alias })) ||
		(await GroupModel.create({
			ownerID,
			alias,
			name: info.name,
			createdAt: new Date(),
		}))

	// Обновим группу, если она поменялось
	if (savedGroup.name !== info.name || savedGroup.ownerID !== ownerID) {
		savedGroup.name = info.name
		savedGroup.ownerID = ownerID
		await savedGroup.save()
	}

	const savedChat = await ChatModel.findOne({ chatId: String(ctx.chat.id) })

	if (savedChat) {
		if (savedChat.groups.find((id) => String(id) === String(savedGroup._id))) {
			return ctx.reply(`Группа "${savedGroup.name}" уже отслеживается`)
		}

		const MAX_TRACKING_GROUPS = 20
		if (savedChat.groups.length >= MAX_TRACKING_GROUPS) {
			return ctx.reply(`Увы, нельзя отслеживать более ${MAX_TRACKING_GROUPS} групп`)
		}

		savedChat.groups = [...savedChat.groups, savedGroup._id]

		await savedChat.save()
	} else {
		await ChatModel.create({
			chatId: String(ctx.chat.id),
			createdAt: new Date(),
			failedSends: 0,
			groups: [savedGroup._id],
		})
	}

	return ctx.reply(`Группа "${savedGroup.name}" добавлена в список отслеживаемых`)
}
