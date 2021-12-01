import { server } from './mswServer.js'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterEach(() => {
	server.resetHandlers()
})

afterAll(() => server.close())
