import { Schema, Document, model } from 'mongoose'

export interface Group extends Document {
	ownerID: number
	alias: string
	name: string
	createdAt: Date
	lastPost?: {
		postId: number
		checkedAt: Date
		createdAt: Date
	}
}

export const GroupModel = model<Group>(
	'Group',
	new Schema({
		ownerID: { type: Number, required: true },
		alias: { type: String, required: true },
		name: { type: String, required: true },
		createdAt: { type: Date, required: true },
		lastPost: {
			required: false,
			type: {
				postId: { type: Number, required: true },
				checkedAt: { type: Date, required: true },
				createdAt: { type: Date, required: true },
			},
		},
	}),
)
