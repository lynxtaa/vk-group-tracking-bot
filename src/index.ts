import 'dotenv-safe/config'

import mongoose from 'mongoose'
import ms from 'ms'

import { checkUpdates } from './checkUpdates'
import { createBot } from './createBot'

async function main() {
	const bot = createBot({
		token: process.env.BOT_TOKEN,
		isDev: process.env.NODE_ENV !== 'production',
	})

	await bot.launch()

	await mongoose.connect(process.env.MONGODB_URI, {
		useCreateIndex: true,
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
	})

	// eslint-disable-next-line no-console
	console.log('Bot launched...')

	// eslint-disable-next-line no-console
	const safeCheck = () => checkUpdates(bot).catch(console.error.bind(console))

	setInterval(safeCheck, ms(process.env.CHECK_INTERVAL || '15m'))

	safeCheck()
}

main()

process.on('unhandledRejection', (err) => {
	throw err
})
