import { prop, getModelForClass, Ref } from '@typegoose/typegoose'

import { Group } from './Group'

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
