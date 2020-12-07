import { Infer } from 'superstruct'

import { WallPost } from '../utils/structs'

export const generatePost = (
	overrides?: Partial<Infer<typeof WallPost>>,
): Infer<typeof WallPost> => ({
	id: 10,
	from_id: 123,
	owner_id: 123,
	date: 0,
	marked_as_ads: 0,
	is_pinned: 0,
	post_type: '',
	text: 'my post',
	comments: { count: 100 },
	likes: { count: 100 },
	copy_history: undefined,
	copyright: undefined,
	attachments: undefined,
	...overrides,
})
