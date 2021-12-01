import mongoose from 'mongoose'
import ms from 'ms'

import { checkUpdates } from './checkUpdates.js'
import { createBot } from './createBot.js'

const bot = createBot({
	token: process.env.BOT_TOKEN,
	isDev: process.env.NODE_ENV !== 'production',
})

await bot.launch()

await mongoose.connect(process.env.MONGODB_URI)

// eslint-disable-next-line no-console
console.log('Bot launched...')

function safeCheck() {
	// eslint-disable-next-line no-console
	checkUpdates(bot).catch(console.error.bind(console))
}

setInterval(safeCheck, ms(process.env.CHECK_INTERVAL || '15m'))

safeCheck()
