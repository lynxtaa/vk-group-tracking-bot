import { isDocumentArray } from '@typegoose/typegoose'
import { sortBy } from 'lodash'

import { ChatModel } from '../models/Chat'
import { Group } from '../models/Group'

/** Возвращает группы пользователя */
export async function getUserGroups(chatId: string): Promise<Group[]> {
	const chat = await ChatModel.findOne({ chatId }).populate('groups')

	if (!chat || !isDocumentArray(chat.groups)) {
		return []
	}

	return sortBy(chat.groups, (group) => group.name)
}
