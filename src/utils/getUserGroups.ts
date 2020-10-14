import { sortBy } from 'lodash'

import { ChatModel } from '../models/Chat'
import { Group } from '../models/Group'

/** Возвращает группы пользователя */
export async function getUserGroups(chatId: string): Promise<Group[]> {
	const chat = await ChatModel.findOne({ chatId }).populate('groups')

	if (!chat) {
		return []
	}

	const groups = (chat.groups as unknown) as Group[]

	return sortBy(groups, (group) => group.name)
}
