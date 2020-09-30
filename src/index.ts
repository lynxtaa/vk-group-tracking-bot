import 'dotenv-safe/config'

import { URL } from 'url'
import { vkClient } from './vkClient'

const link = 'https://vk.com/gre4ark'

async function main() {
	const { pathname } = new URL(link)
	const groupId = pathname.replace('/', '')

	const [info] = await vkClient.getGroupById({ group_id: groupId })

	const ownerId = 0 - info.id

	const posts = await vkClient.getWall({
		owner_id: ownerId,
		count: 10,
		offset: 0,
	})

	console.log('ok')
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})

process.on('unhandledRejection', (err) => {
	throw err
})
