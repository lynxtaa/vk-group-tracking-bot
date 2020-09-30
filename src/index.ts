import 'dotenv-safe/config'
import { vkClient } from './vkClient'

vkClient
	.getWall({ ownerId: -69215309, count: 1 })
	.then((result) => {
		console.log(result)
	})
	.catch(console.error.bind(console))

process.on('unhandledRejection', (err) => {
	throw err
})
