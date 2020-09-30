import { object, number, string, array, union, boolean, enums, type } from 'superstruct'

const PhotoSize = type({
	height: number(),
	url: string(),
	type: enums(['l', 'm', 'p', 's', 'x']),
	width: number(),
})

const LinkAttachment = type({
	type: enums(['link']),
	link: type({
		url: string(),
		title: string(),
		caption: string(),
		description: string(),
		photo: object({
			album_id: number(),
			date: number(),
			id: number(),
			owner_id: number(),
			has_tags: boolean(),
			sizes: array(PhotoSize),
			text: string(),
			user_id: number(),
		}),
	}),
})

export const PostAttachment = union([LinkAttachment])

export const WallPost = type({
	id: number(),
	from_id: number(),
	owner_id: number(),
	date: number(),
	post_type: string(),
	text: string(),
	attachments: array(PostAttachment),
	comments: type({ count: number() }),
	likes: type({ count: number() }),
})
