import { URLSearchParams } from 'url'

import fetch from 'node-fetch'
import { assert, array, number, object, Struct, validate } from 'superstruct'

import { WallPost } from './structs'

export enum WallPostsFilter {
	/** записи владельца стены */
	Owner = 'owner',
	/** записи не от владельца стены */
	Others = 'others',
	/** все записи на стене */
	All = 'all',
}

class VKClient {
	private apiVersion: number
	private token: string

	constructor({ token }: { token: string }) {
		this.token = token
		this.apiVersion = 5.124
	}

	private async callMethod<T>(
		name: string,
		params: Record<string, string | number>,
		struct: Struct<T>,
	): Promise<T> {
		const searchParams = new URLSearchParams()

		for (const [key, value] of Object.entries(params)) {
			searchParams.append(key, String(value))
		}

		searchParams.append('access_token', this.token)
		searchParams.append('v', String(this.apiVersion))

		const response = await fetch(`https://api.vk.com/method/${name}?${searchParams}`)

		if (!response.ok) {
			throw new Error(`Request failed: ${response.url}: ${response.status}`)
		}

		const json = await response.json()
		console.log(JSON.stringify(json, null, '  '))

		if ('error' in json) {
			throw new Error(`Request failed: ${response.url}: ${json.error.error_msg}`)
		}

		assert(json.response, struct)

		return json.response
	}

	/** Возвращает список записей со стены пользователя или сообщества */
	async getWall({
		ownerId,
		count,
		filter = WallPostsFilter.All,
	}: {
		ownerId: number
		count: number
		/** определяет, какие типы записей на стене необходимо получить */
		filter?: WallPostsFilter
	}) {
		const WallPosts = object({ count: number(), items: array(WallPost) })

		const result = await this.callMethod(
			'wall.get',
			{
				owner_id: ownerId,
				count: count,
				filter,
			},
			WallPosts,
		)

		return result
	}
}

export const vkClient = new VKClient({ token: process.env.VK_SERVICE_TOKEN! })
