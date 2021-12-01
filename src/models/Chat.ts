import typegoose, { Ref } from '@typegoose/typegoose'

const { prop, getModelForClass } = typegoose

import { Group } from './Group.js'

class Chat {
	@prop()
	createdAt!: Date

	@prop()
	chatId!: string

	@prop()
	failedSends!: number

	@prop({ ref: Group })
	groups!: Ref<Group>[]
}

export const ChatModel = getModelForClass(Chat)
