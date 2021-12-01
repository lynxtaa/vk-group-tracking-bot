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

export const AlbumAttachment = type({
	type: literal('album'),
	album: type({
		id: number(),
		thumb: type({
			album_id: number(),
			date: number(),
			id: number(),
			owner_id: number(),
			access_key: string(),
			sizes: array(Image),
			user_id: number(),
		}),
		owner_id: number(),
		title: string(),
		description: string(),
		created: number(),
		updated: number(),
		size: number(),
	}),
})

export const AudioAttachment = type({
	type: literal('audio'),
	audio: type({
		artist: string(),
		id: number(),
		owner_id: number(),
		title: string(),
		duration: number(),
		track_code: string(),
		date: number(),
	}),
})

export const DocAttachment = type({
	type: literal('doc'),
	doc: type({
		id: number(),
		owner_id: number(),
		title: string(),
		size: number(),
		ext: string(),
		date: number(),
		type: number(),
		url: string(),
		preview: optional(
			type({
				photo: type({
					sizes: array(
						type({
							height: number(),
							src: string(),
							width: number(),
						}),
					),
				}),
				video: type({
					src: string(),
					width: number(),
					height: number(),
					file_size: number(),
				}),
			}),
		),
		access_key: string(),
	}),
})

export const EventAttachment = type({
	type: literal('event'),
	event: type({
		id: number(),
		address: optional(string()),
		time: number(),
	}),
})

export const LinkAttachment = type({
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

export const MarketAttachment = type({
	type: literal('market'),
	market: type({
		description: string(),
		id: number(),
		owner_id: number(),
		price: type({ text: string() }),
		thumb_photo: string(),
		title: string(),
	}),
})

export const PhotoAttachment = type({
	type: literal('photo'),
	photo: type({
		album_id: number(),
		date: number(),
		id: number(),
		owner_id: number(),
		has_tags: boolean(),
		access_key: optional(string()),
		sizes: array(Image),
		text: string(),
		user_id: optional(number()),
	}),
})

export const PodcastAttachment = type({
	type: literal('podcast'),
	podcast: type({
		artist: string(),
		id: number(),
		owner_id: number(),
		title: string(),
		duration: number(),
		url: string(),
		date: number(),
	}),
})

export const PollAttachment = type({
	type: literal('poll'),
	poll: type({
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
	}),
})

export const VideoAttachment = type({
	type: literal('video'),
	video: type({
		access_key: string(),
		date: number(),
		description: optional(string()),
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

export const Attachment = union([
	AlbumAttachment,
	AudioAttachment,
	DocAttachment,
	EventAttachment,
	LinkAttachment,
	MarketAttachment,
	PhotoAttachment,
	PodcastAttachment,
	PollAttachment,
	VideoAttachment,
])

export const Repost = type({
	id: number(),
	from_id: number(),
	owner_id: number(),
	date: number(),
	post_type: string(),
	text: string(),
	attachments: optional(array(Attachment)),
})

export const WallPost = type({
	id: number(),
	from_id: number(),
	owner_id: number(),
	date: number(),
	marked_as_ads: number(),
	is_pinned: optional(number()),
	post_type: string(),
	text: string(),
	attachments: optional(array(Attachment)),
	copy_history: optional(array(Repost)),
	comments: type({ count: number() }),
	likes: type({ count: number() }),
	copyright: optional(type({ link: string(), type: string(), name: string() })),
})
