import { URLSearchParams } from 'url'

import fetch from 'node-fetch'

export enum WallPostsFilter {
	/** записи владельца стены */
	Owner = 'owner',
	/** записи не от владельца стены */
	Others = 'others',
	/** все записи на стене */
	All = 'all',
}

type PhotoSize = {
	height: number
	url: string
	type: 'l' | 'm' | 'p' | 's' | 'x'
	width: number
}

type PostAttachment = {
	type: 'link'
	link: {
		url: string
		title: string
		caption: string
		description: string
		photo: {
			album_id: number
			date: number
			id: number
			owner_id: number
			has_tags: boolean
			sizes: PhotoSize[]
			text: string
			user_id: number
		}
	}
}

class VKClient {
	private apiVersion: number
	private token: string

	constructor({ token }: { token: string }) {
		this.token = token
		this.apiVersion = 5.124
	}

	private async callMethod<TData extends unknown[] | Record<string, unknown>>(
		methodName: string,
		params: Record<string, string | number>,
	): Promise<TData> {
		const searchParams = new URLSearchParams()

		for (const [key, value] of Object.entries(params)) {
			searchParams.append(key, String(value))
		}

		searchParams.append('access_token', this.token)
		searchParams.append('v', String(this.apiVersion))

		const response = await fetch(
			`https://api.vk.com/method/${methodName}?${searchParams}`,
		)

		if (!response.ok) {
			throw new Error(`Request failed: ${response.url}: ${response.status}`)
		}

		const json = await response.json()
		console.log(JSON.stringify(json, null, '  '))

		if ('error' in json) {
			throw new Error(`Request failed: ${response.url}: ${json.error.error_msg}`)
		}

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
		const result = await this.callMethod<{
			count: number
			items: {
				id: number
				from_id: number
				owner_id: number
				date: number
				post_type: string
				text: string
				attachments: PostAttachment[]
				comments: { count: number }
				likes: { count: number }
			}[]
		}>('wall.get', { owner_id: ownerId, count: count, filter })

		return result
	}
}

export const vkClient = new VKClient({ token: process.env.VK_SERVICE_TOKEN! })
