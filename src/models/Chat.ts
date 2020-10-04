import { Schema, Document, model } from 'mongoose'

export interface Chat extends Document {
	createdAt: Date
	chatId: string
	groups: Schema.Types.ObjectId[]
}

export const ChatModel = model<Chat>(
	'Chat',
	new Schema({
		createdAt: { type: Date, required: true },
		chatId: { type: String, required: true },
		groups: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
	}),
)
