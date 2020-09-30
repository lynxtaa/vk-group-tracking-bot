import 'dotenv-safe/config'

process.on('unhandledRejection', (err) => {
	throw err
})
