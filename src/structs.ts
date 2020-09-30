import {
	object,
	number,
	string,
	array,
	union,
	boolean,
	literal,
	type,
	optional,
} from 'superstruct'

const Image = type({
	height: number(),
	url: string(),
	width: number(),
})

const LinkAttachment = type({
	type: literal('link'),
	link: type({
		url: string(),
		title: string(),
		caption: optional(string()),
		description: string(),
		photo: optional(
			object({
				album_id: number(),
				date: number(),
				id: number(),
				owner_id: number(),
				has_tags: boolean(),
				sizes: array(Image),
				text: string(),
				user_id: number(),
			}),
		),
	}),
})

const PhotoAttachment = type({
	type: literal('photo'),
	photo: type({
		album_id: number(),
		date: number(),
		id: number(),
		owner_id: number(),
		has_tags: boolean(),
		access_key: string(),
		sizes: array(Image),
		text: string(),
		user_id: number(),
	}),
})

const VideoAttachment = type({
	type: literal('video'),
	video: type({
		access_key: string(),
		date: number(),
		description: string(),
		duration: number(),
		image: array(Image),
		first_frame: optional(array(Image)),
		width: optional(number()),
		height: optional(number()),
		id: number(),
		owner_id: number(),
		title: string(),
		track_code: string(),
		views: number(),
	}),
})

const PollAttachment = type({
	type: literal('poll'),
	poll: type({
		anonymous: boolean(),
		multiple: boolean(),
		end_date: number(),
		closed: boolean(),
		is_board: boolean(),
		created: number(),
		id: number(),
		owner_id: number(),
		question: string(),
		votes: number(),
		answers: array(
			type({
				id: number(),
				rate: number(),
				text: string(),
				votes: number(),
			}),
		),
		author_id: number(),
	}),
})

const Attachment = union([
	LinkAttachment,
	PhotoAttachment,
	PollAttachment,
	VideoAttachment,
])

export const WallPost = type({
	id: number(),
	from_id: number(),
	owner_id: number(),
	date: number(),
	post_type: string(),
	text: string(),
	attachments: optional(array(Attachment)),
	copy_history: optional(
		array(
			type({
				id: number(),
				from_id: number(),
				owner_id: number(),
				date: number(),
				post_type: string(),
				text: string(),
				attachments: optional(array(Attachment)),
			}),
		),
	),
	comments: type({ count: number() }),
	likes: type({ count: number() }),
})
