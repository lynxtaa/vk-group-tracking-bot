import { prop, getModelForClass, defaultClasses } from '@typegoose/typegoose'

class LastPost {
	@prop()
	postId!: number

	@prop()
	checkedAt!: Date

	@prop()
	createdAt!: Date
}

export class Group extends defaultClasses.Base {
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
