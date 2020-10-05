import 'dotenv-safe/config'

import ms from 'ms'
import { URL } from 'url'
import { Telegraf } from 'telegraf'
import mongoose from 'mongoose'
import { TelegrafContext } from 'telegraf/typings/context'

import { vkClient } from './vkClient'
import { wrapInCodeBlock } from './utils/wrapInCodeBlock'
import { Chat, ChatModel } from './models/Chat'
import { Group, GroupModel } from './models/Group'
import { groupBy } from 'lodash'
import { StructType } from 'superstruct'
import { WallPost } from './structs'
import { parseWallPost } from './utils/parseWallPost'
import { getNewPosts } from './utils/getNewPosts'

const helpText = [
	'Привет! Я бот отслеживания постов в группах Вконтакте.',
	'Просто пиши мне ссылки на группы, я начну их отслеживать и публиковать сюда обновления.',
	'Получается не всегда хорошо, но я очень стараюсь.\n',
	'Доступные команды:',
	'/list - список отслеживаемых групп',
	'/del http://vk.com/group123 - удалить группу из отслеживаемых',
].join('\n')

async function main() {
	const bot = new Telegraf(process.env.BOT_TOKEN!)

	const isChatAlive = (chatId: string | number): Promise<boolean> =>
		bot.telegram
			.sendChatAction(chatId, 'typing')
			.then(() => true)
			.catch(() => false)

	bot.start((ctx) => ctx.reply(helpText, { disable_web_page_preview: true }))

	bot.catch((err: Error, ctx: TelegrafContext) => {
		// eslint-disable-next-line no-console
		console.error(`Ooops, encountered an error for ${ctx.updateType}`, err)

		if (process.env.NODE_ENV === 'production') {
			return ctx.reply('Ой, ошибка...')
		}

		return ctx.replyWithMarkdown(wrapInCodeBlock(err.stack || err.message))
	})

	bot.help((ctx) => ctx.reply(helpText, { disable_web_page_preview: true }))

	bot.command('list', async (ctx) => {
		if (!ctx.chat) {
			return ctx.reply('?')
		}

		const chat = await ChatModel.findOne({ chatId: String(ctx.chat.id) }).populate(
			'groups',
		)

		if (!chat || chat.groups.length === 0) {
			return ctx.reply('Подписок нет')
		}

		const groups = (chat.groups as unknown) as Group[]

		return ctx.reply(
			[
				'Твои подписки:',
				...groups
					.map((group) => `• ${group.name} (https://vk.com/${group.alias})`)
					.sort(),
			].join('\n'),
			{ disable_web_page_preview: true },
		)
	})

	bot.hears(/^http(s)?:/, async (ctx) => {
		if (!ctx.message?.text || !ctx.chat) {
			return ctx.reply('?')
		}

		const { pathname } = new URL(ctx.message.text)
		const alias = pathname.replace('/', '')

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
			if (savedChat.groups.find((id) => id === savedGroup._id)) {
				return ctx.reply(`Группа "${savedGroup.name}" уже отслеживается`)
			}

			if (savedChat.groups.length >= 100) {
				return ctx.reply('Увы, нельзя отслеживать более 100 групп')
			}

			savedChat.groups = [...savedChat.groups, savedGroup._id]

			await savedChat.save()
		} else {
			await ChatModel.create({
				chatId: String(ctx.chat.id),
				createdAt: new Date(),
				groups: [savedGroup._id],
			})
		}

		return ctx.reply(`Группа "${savedGroup.name}" добавлена в список отслеживаемых`)
	})

	bot.command('/latest', async (ctx) => {
		if (!ctx.chat || !ctx.message?.text) {
			return ctx.reply('?')
		}

		const [, link] = ctx.message.text.split(' ')

		const { pathname } = new URL(link)
		const alias = pathname.replace('/', '')

		let info: { id: number; name: string }

		try {
			const infos = await vkClient.getGroupById({ group_id: alias })
			info = infos[0]
		} catch (err) {
			return ctx.reply(`Группа закрытая либо не существует`)
		}

		const ownerID = 0 - info.id

		const posts = await vkClient.getWall({
			owner_id: ownerID,
			count: 5,
			offset: 0,
		})

		const [latestPost] = posts.items.filter(
			(post) => !post.marked_as_ads && !post.is_pinned,
		)

		if (latestPost) {
			await sendPostToChat({
				chatId: String(ctx.chat.id),
				post: latestPost,
				groupName: info.name,
			})
		} else {
			await ctx.reply('Новости не найдены')
		}
	})

	bot.command('del', async (ctx) => {
		if (!ctx.chat || !ctx.message?.text) {
			return ctx.reply('?')
		}

		const [, link] = ctx.message.text.split(' ')

		const { pathname } = new URL(link)
		const alias = pathname.replace('/', '')

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
	})

	if (process.env.NODE_ENV !== 'production') {
		bot.command('debug', (ctx) => {
			const debug = vkClient.toggleDebug()
			return ctx.reply(debug ? 'Debug enabled' : 'Debug disabled')
		})
	}

	await bot.launch()

	await mongoose.connect(process.env.MONGODB_URI!, {
		useCreateIndex: true,
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
	})

	// eslint-disable-next-line no-console
	console.log('Bot launched...')

	async function sendPostToChat({
		chatId,
		groupName,
		post,
	}: {
		chatId: string
		groupName: string
		post: StructType<typeof WallPost>
	}) {
		const { text, photos, videos } = parseWallPost(groupName, post)

		await bot.telegram.sendMessage(chatId, text, {
			disable_web_page_preview: true,
		})

		if (photos.length > 0) {
			await bot.telegram.sendMediaGroup(chatId, photos)
		}

		for (const videoLink of videos) {
			await bot.telegram.sendMessage(chatId, videoLink)
		}

		const repost = post.copy_history?.[0]

		if (repost) {
			const [info] = await vkClient.getGroupById({
				group_id: String(0 - repost.owner_id),
			})

			const { text, photos, videos } = parseWallPost(info.name, repost)

			await bot.telegram.sendMessage(chatId, `--- REPOST ---\n\n${text}`, {
				disable_web_page_preview: true,
			})

			if (photos.length > 0) {
				await bot.telegram.sendMediaGroup(chatId, photos)
			}

			for (const videoLink of videos) {
				await bot.telegram.sendMessage(chatId, videoLink)
			}
		}
	}

	async function check() {
		const chatsWithGroups = await ChatModel.find({
			groups: { $exists: true, $ne: [] },
		})

		const aliveChats: Chat[] = []

		for (const chat of chatsWithGroups) {
			const isAlive = await isChatAlive(chat.chatId)

			if (isAlive) {
				aliveChats.push(chat)
			}
		}

		const byGroupId = groupBy(
			aliveChats.flatMap((chat) => chat.groups.map((groupId) => ({ chat, groupId }))),
			(el) => el.groupId,
		)

		const groups = await GroupModel.find().where('_id').in(Object.keys(byGroupId))

		const checkResults = await Promise.allSettled(
			groups.map(async (group) => {
				const newPosts = await getNewPosts(group)

				if (newPosts[0]) {
					group.lastPost = {
						postId: newPosts[0].id,
						checkedAt: new Date(),
						createdAt: new Date(),
					}
					await group.save()
				} else if (group.lastPost) {
					group.lastPost.checkedAt = new Date()
					await group.save()
				}

				return newPosts
			}),
		)

		for (let i = 0; i < checkResults.length; i++) {
			const result = checkResults[i]
			const group = groups[i]

			if (result.status === 'rejected') {
				// eslint-disable-next-line no-console
				console.error(`Error in ${group.name}: ${result.reason}`)
				continue
			}

			for (const post of result.value) {
				for (const { chat } of byGroupId[group._id]) {
					try {
						await sendPostToChat({ chatId: chat.chatId, post, groupName: group.name })
					} catch (err) {
						// eslint-disable-next-line no-console
						console.error(
							`Error in sending post ${post.id} to chat ${chat.chatId} (${err})`,
						)
					}
				}
			}
		}
	}

	// eslint-disable-next-line no-console
	const safeCheck = () => check().catch(console.error.bind(console))

	setInterval(safeCheck, ms(process.env.INTERVAL || '15m'))

	safeCheck()
}

main()

process.on('unhandledRejection', (err) => {
	throw err
})
