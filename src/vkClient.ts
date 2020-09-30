import { URLSearchParams } from 'url'

import fetch from 'node-fetch'
import { assert, array, number, type, StructType } from 'superstruct'

import { WallPost } from './structs'
import assertNever from './utils/assertNever'

const responseTypes = {
	'wall.get': type({ count: number(), items: array(WallPost) }),
}

class VKClient {
	private apiVersion: number
	private token: string

	constructor({ token }: { token: string }) {
		this.token = token
		this.apiVersion = 5.124
	}

	/** Возвращает список записей со стены пользователя или сообщества */
	async callMethod(
		name: 'wall.get',
		params: {
			owner_id: number
			count: number
			/** определяет, какие типы записей на стене необходимо получить */
			filter?: 'owner' | 'others' | 'all'
			offset?: number
		},
	): Promise<StructType<typeof responseTypes['wall.get']>>

	async callMethod(
		name: 'wall.get',
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

		const { response: data, error } = await response.json()
		// console.log(JSON.stringify(error || data, null, '  '))

		if (error) {
			throw new Error(`Request failed: ${response.url}: ${error.error_msg}`)
		}

		switch (name) {
			case 'wall.get':
				assert(data, responseTypes['wall.get'])
				return data
			default:
				return assertNever(name)
		}
	}
}

export const vkClient = new VKClient({ token: process.env.VK_SERVICE_TOKEN! })
