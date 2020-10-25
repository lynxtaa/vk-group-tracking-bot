import { Schema, Document, model } from 'mongoose'

export interface Chat extends Document {
	createdAt: Date
	chatId: string
	failedSends: number
	groups: Schema.Types.ObjectId[]
}

export const ChatModel = model<Chat>(
	'Chat',
	new Schema({
		createdAt: { type: Date, required: true },
		chatId: { type: String, required: true },
		failedSends: { type: Number, required: true },
		groups: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
	}),
)
