import typegoose from '@typegoose/typegoose'
import sortBy from 'lodash/sortBy.js'

import { ChatModel } from '../models/Chat.js'
import { Group } from '../models/Group.js'

const { isDocumentArray } = typegoose

/** Возвращает группы пользователя */
export async function getUserGroups(chatId: string): Promise<Group[]> {
	const chat = await ChatModel.findOne({ chatId }).populate('groups')

	if (!chat || !isDocumentArray(chat.groups)) {
		return []
	}

	return sortBy(chat.groups, group => group.name)
}
