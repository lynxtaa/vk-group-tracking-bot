import { StructType } from 'superstruct'
import { sortBy, last } from 'lodash'
import { InputMediaPhoto } from 'telegraf/typings/telegram-types'

import { Repost, WallPost } from '../structs'
import { formatVKLinks } from './formatVKLinks'
import { vkClient } from '../vkClient'

const getBiggestImage = (sizes: { height: number; url: string; width: number }[]) =>
	last(sortBy(sizes, (size) => size.height * size.width))

type ParsedPost = {
	/** Audio titles */
	audios: string[]
	/** Main post text */
	text: string
	/** Photo URLs */
	photos: InputMediaPhoto[]
	/** Video Links */
	videos: string[]
	/** Repost */
	repost: ParsedPost | null
}

export async function parseWallPost(
	groupName: string,
	post: StructType<typeof WallPost> | StructType<typeof Repost>,
): Promise<ParsedPost> {
	const data: ParsedPost = {
		text: [
			`${groupName}\nhttps://vk.com/wall${post.owner_id}_${post.id}`,
			formatVKLinks(post.text),
			'copyright' in post &&
				post.copyright !== undefined &&
				`Источник: ${post.copyright.link}`,
		]
			.filter(Boolean)
			.join('\n\n'),
		audios: [],
		videos: [],
		photos: [],
		repost: null,
	}

	for (const attach of post.attachments || []) {
		if (attach.type === 'photo') {
			const biggestPhoto = getBiggestImage(attach.photo.sizes)

			if (biggestPhoto) {
				data.photos.push({ type: 'photo', media: biggestPhoto.url })
			}
		} else if (attach.type === 'link' && attach.link.photo) {
			const biggestPhoto = getBiggestImage(attach.link.photo.sizes)

			if (biggestPhoto) {
				data.photos.push({
					type: 'photo',
					media: biggestPhoto.url,
					caption: `${attach.link.title} (${attach.link.url})`,
				})
			}
		} else if (attach.type === 'video') {
			data.videos.push(`https://vk.com/video${attach.video.owner_id}_${attach.video.id}`)
		} else if (attach.type === 'market') {
			data.photos.push({
				type: 'photo',
				media: attach.market.thumb_photo,
				caption: `${attach.market.title} (${attach.market.price.text})`,
			})
		} else if (attach.type === 'audio') {
			// TODO: научиться бы выкачивать аудио
			data.audios.push(`Аудио: ${attach.audio.artist} - ${attach.audio.title}`)
		}
	}

	if (data.audios.length > 0) {
		data.text += `\n\n${data.audios.join('\n')}`
	}

	const repost = 'copy_history' in post && post.copy_history ? post.copy_history[0] : null

	if (repost) {
		const [info] = await vkClient.getGroupById({
			group_id: String(0 - repost.owner_id),
		})

		data.repost = await parseWallPost(info.name, repost)
	}

	return data
}