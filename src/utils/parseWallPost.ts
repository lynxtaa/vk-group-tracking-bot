import { StructType } from 'superstruct'
import { sortBy, last } from 'lodash'
import { InputMediaPhoto } from 'telegraf/typings/telegram-types'

import { Repost, WallPost } from '../structs'
import { formatVKLinks } from './formatVKLinks'

const getBiggestImage = (sizes: { height: number; url: string; width: number }[]) =>
	last(sortBy(sizes, (size) => size.height * size.width))

export function parseWallPost(
	groupName: string,
	post: StructType<typeof WallPost> | StructType<typeof Repost>,
): {
	/** Main post text */
	text: string
	/** Photo URLs */
	photos: InputMediaPhoto[]
	/** Video Links */
	videos: string[]
} {
	let text = [
		`${groupName}\nhttps://vk.com/wall${post.owner_id}_${post.id}`,
		formatVKLinks(post.text),
		'copyright' in post &&
			post.copyright !== undefined &&
			`Источник: ${post.copyright.link}`,
	]
		.filter(Boolean)
		.join('\n\n')

	const photos: InputMediaPhoto[] = []
	const videos: string[] = []
	const audios: string[] = []

	for (const attach of post.attachments || []) {
		if (attach.type === 'photo') {
			const biggestPhoto = getBiggestImage(attach.photo.sizes)

			if (biggestPhoto) {
				photos.push({ type: 'photo', media: biggestPhoto.url })
			}
		} else if (attach.type === 'link' && attach.link.photo) {
			const biggestPhoto = getBiggestImage(attach.link.photo.sizes)

			if (biggestPhoto) {
				photos.push({ type: 'photo', media: biggestPhoto.url })
			}
		} else if (attach.type === 'video') {
			videos.push(`https://vk.com/video${attach.video.owner_id}_${attach.video.id}`)
		} else if (attach.type === 'market') {
			photos.push({
				type: 'photo',
				media: attach.market.thumb_photo,
				caption: `${attach.market.title} (${attach.market.price.text})`,
			})
		} else if (attach.type === 'audio') {
			// TODO: научиться бы выкачивать аудио
			audios.push(`Аудио: ${attach.audio.artist} - ${attach.audio.title}`)
		}
	}

	if (audios.length > 0) {
		text += `\n\n${audios.join('\n')}`
	}

	return { text, photos, videos }
}
