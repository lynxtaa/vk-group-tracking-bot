import { URLSearchParams } from 'url'

import fetch from 'node-fetch'
import { assert, array, number, type, string } from 'superstruct'

import { WallPost } from './structs'

class VKClient {
	private apiVersion: number
	private token: string

	constructor({ token }: { token: string }) {
		this.token = token
		this.apiVersion = 5.124
	}

	private async callMethod(
		name: string,
		params: Record<string, string | number | undefined>,
	): Promise<Record<string, unknown> | unknown[]> {
		const searchParams = new URLSearchParams()

		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined) {
				searchParams.append(key, String(value))
			}
		}

		searchParams.append('access_token', this.token)
		searchParams.append('v', String(this.apiVersion))

		const response = await fetch(`https://api.vk.com/method/${name}?${searchParams}`)

		if (!response.ok) {
			throw new Error(`Request failed: ${response.url}: ${response.status}`)
		}

		const json = await response.json()

		if ('error' in json) {
			throw new Error(`Request failed: ${response.url}: ${json.error.error_msg}`)
		}

		return json.response
	}

	/** Возвращает список записей со стены пользователя или сообщества */
	async getWall(params: {
		owner_id: number
		count: number
		/** определяет, какие типы записей на стене необходимо получить */
		filter?: 'owner' | 'others' | 'all'
		offset?: number
	}) {
		const WallPosts = type({ count: number(), items: array(WallPost) })

		const data = await this.callMethod('wall.get', params)

		assert(data, WallPosts)

		return data
	}

	/** Возвращает информацию о заданном сообществе */
	async getGroupById(params: { group_id: string }) {
		const GroupInfos = array(type({ id: number(), name: string() }))

		const data = await this.callMethod('groups.getById', params)

		assert(data, GroupInfos)

		return data
	}
}

export const vkClient = new VKClient({ token: process.env.VK_SERVICE_TOKEN! })
