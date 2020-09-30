import 'dotenv-safe/config'
import { vkClient } from './vkClient'

vkClient
	.callMethod('wall.get', {
		owner_id: -69215309,
		count: 100,
		offset: 0,
	})
	.then((result) => {
		console.log('ok')
	})
	.catch(console.error.bind(console))

process.on('unhandledRejection', (err) => {
	throw err
})
