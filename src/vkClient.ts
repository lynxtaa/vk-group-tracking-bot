import { URLSearchParams } from 'url'

import got from 'got'
import ms from 'ms'
import PQueue from 'p-queue'
import { assert, array, number, type, string, Infer, optional } from 'superstruct'

import { WallPost } from './utils/structs.js'

const GroupInfos = array(
	type({
		id: number(),
		name: string(),
		screen_name: optional(string()),
	}),
)
const WallPosts = type({ count: number(), items: array(WallPost) })

export class VKClient {
	private apiVersion: number
	private token: string
	private queue: PQueue
	private debug: boolean

	constructor({ token, debug = false }: { token: string; debug?: boolean }) {
		this.token = token
		this.apiVersion = 5.124
		this.debug = debug
		this.queue = new PQueue({
			intervalCap: 1,
			// На самом деле ограничение ВК -- 3 запроса в секунду
			// (https://vk.com/dev/api_requests), но перестрахуемся
			// и будем совершать запросы не чаще 1 в секунду
			interval: ms('1s'),
		})
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

		const json = await this.queue.add(() =>
			got(`https://api.vk.com/method/${name}`, { searchParams, timeout: 10_000 }).json(),
		)

		const data = json as
			| { error: { error_msg: string } }
			| { response: Record<string, unknown> | unknown[] }

		if (this.debug) {
			// eslint-disable-next-line no-console
			console.log(JSON.stringify(data, null, '  '))
		}

		if ('error' in data) {
			throw new Error(`Request failed for API method: ${name}: ${data.error.error_msg}`)
		}

		return data.response
	}

	toggleDebug(): boolean {
		this.debug = !this.debug
		return this.debug
	}

	/** Возвращает список записей со стены пользователя или сообщества */
	async getWall(params: {
		owner_id: number
		count: number
		/** определяет, какие типы записей на стене необходимо получить */
		filter?: 'owner' | 'others' | 'all'
		offset?: number
	}): Promise<Infer<typeof WallPosts>> {
		const data = await this.callMethod('wall.get', params)

		assert(data, WallPosts)

		return data
	}

	/** Возвращает информацию о заданном сообществе */
	async getGroupById(params: { group_id: string }): Promise<Infer<typeof GroupInfos>> {
		const data = await this.callMethod('groups.getById', params)

		assert(data, GroupInfos)

		return data
	}
}

export const vkClient = new VKClient({ token: process.env.VK_SERVICE_TOKEN })
