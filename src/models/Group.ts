import typegoose from '@typegoose/typegoose'

const { prop, getModelForClass } = typegoose

class LastPost {
	@prop()
	postId!: number

	@prop()
	checkedAt!: Date

	@prop()
	createdAt!: Date
}

export class Group {
	_id?: string

	@prop()
	ownerID!: number

	@prop()
	alias!: string

	@prop()
	name!: string

	@prop()
	createdAt!: Date

	@prop()
	lastPost?: LastPost
}

export const GroupModel = getModelForClass(Group)
