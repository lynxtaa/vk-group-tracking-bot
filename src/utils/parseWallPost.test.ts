import { generatePost } from '../test-utils'
import { vkClient, VKClient } from '../vkClient'

import { parseWallPost } from './parseWallPost'

jest.mock('../vkClient', () => ({
	vkClient: { getGroupById: jest.fn() },
}))

// eslint-disable-next-line @typescript-eslint/unbound-method
const mockGetGroupById = vkClient.getGroupById as jest.Mock<
	ReturnType<VKClient['getGroupById']>,
	Parameters<VKClient['getGroupById']>
>

it('returns parsed post', async () => {
	const post = generatePost({
		text: `Новая улица в [https://ru.wikipedia.org/wiki/%D0%9E%D1%81%D0%BB%D0%BE|Осло]!`,
		copyright: { link: 'http://copyright.com', type: 'hz', name: '@ Oslo' },
	})

	const parsedPost = await parseWallPost('Город', post)

	expect(parsedPost).toMatchInlineSnapshot(`
		Object {
		  "audios": Array [],
		  "links": Array [],
		  "photos": Array [],
		  "repost": null,
		  "text": "Город
		https://vk.com/wall123_10

		Новая улица в Осло (https://ru.wikipedia.org/wiki/%D0%9E%D1%81%D0%BB%D0%BE)!

		Источник: http://copyright.com",
		  "videos": Array [],
		}
	`)
})

it('parses attached photos', async () => {
	const post = generatePost({
		text: `Смотрите фото!`,
		attachments: [
			{
				type: 'photo',
				photo: {
					album_id: 10,
					date: 0,
					id: 1,
					owner_id: -10,
					has_tags: false,
					access_key: '',
					sizes: [
						{ height: 10, url: 'https://small-image.jpg', width: 10 },
						{ height: 50, url: 'https://big-image.jpg', width: 50 },
						{ height: 100, url: 'https://medium-image.jpg', width: 10 },
					],
					text: 'Вот такие дела!',
					user_id: undefined,
				},
			},
		],
	})

	const parsedPost = await parseWallPost('Город', post)

	expect(parsedPost).toMatchInlineSnapshot(`
		Object {
		  "audios": Array [],
		  "links": Array [],
		  "photos": Array [
		    Object {
		      "media": "https://big-image.jpg",
		      "type": "photo",
		    },
		  ],
		  "repost": null,
		  "text": "Город
		https://vk.com/wall123_10

		Смотрите фото!",
		  "videos": Array [],
		}
	`)
})

it('parses attached links', async () => {
	const post = generatePost({
		text: `Смотрите ссылку!`,
		attachments: [
			{
				type: 'link',
				link: {
					url: 'http://example.com',
					title: 'Example.com',
					caption: undefined,
					description: '',
					photo: {
						album_id: 1,
						date: 1,
						id: 1,
						owner_id: 1,
						has_tags: false,
						sizes: [
							{ height: 10, url: 'https://small-image.jpg', width: 10 },
							{ height: 50, url: 'https://big-image.jpg', width: 50 },
							{ height: 100, url: 'https://medium-image.jpg', width: 10 },
						],
						text: '',
						user_id: 1,
					},
				},
			},
		],
	})

	const parsedPost = await parseWallPost('Город', post)

	expect(parsedPost).toMatchInlineSnapshot(`
		Object {
		  "audios": Array [],
		  "links": Array [
		    "http://example.com",
		  ],
		  "photos": Array [],
		  "repost": null,
		  "text": "Город
		https://vk.com/wall123_10

		Смотрите ссылку!",
		  "videos": Array [],
		}
	`)
})

it('parses attached videos', async () => {
	const post = generatePost({
		text: `Смотрите видео!`,
		attachments: [
			{
				type: 'video',
				video: {
					access_key: '',
					date: 0,
					description: undefined,
					duration: 1000,
					image: [],
					first_frame: undefined,
					width: undefined,
					height: undefined,
					id: 333,
					owner_id: 222,
					title: 'Видео',
					track_code: '',
					views: 10,
				},
			},
		],
	})

	const parsedPost = await parseWallPost('Город', post)

	expect(parsedPost).toMatchInlineSnapshot(`
		Object {
		  "audios": Array [],
		  "links": Array [],
		  "photos": Array [],
		  "repost": null,
		  "text": "Город
		https://vk.com/wall123_10

		Смотрите видео!",
		  "videos": Array [
		    "https://vk.com/video222_333",
		  ],
		}
	`)
})

it('parses attached market', async () => {
	const post = generatePost({
		text: `Купи!`,
		attachments: [
			{
				type: 'market',
				market: {
					thumb_photo: 'https://photo.jpg',
					title: 'Кофемолка',
					description: '',
					id: 134,
					owner_id: 111,
					price: { text: '100$' },
				},
			},
		],
	})

	const parsedPost = await parseWallPost('Город', post)

	expect(parsedPost).toMatchInlineSnapshot(`
		Object {
		  "audios": Array [],
		  "links": Array [],
		  "photos": Array [
		    Object {
		      "caption": "Кофемолка (100$)",
		      "media": "https://photo.jpg",
		      "type": "photo",
		    },
		  ],
		  "repost": null,
		  "text": "Город
		https://vk.com/wall123_10

		Купи!",
		  "videos": Array [],
		}
	`)
})

it('parses attached audios', async () => {
	const post = generatePost({
		text: `Слушай аудио!`,
		attachments: [
			{
				type: 'audio',
				audio: {
					duration: 100,
					track_code: '',
					date: 0,
					title: 'Money',
					id: 134,
					owner_id: 111,
					artist: 'Pink Floyd',
				},
			},
		],
	})

	const parsedPost = await parseWallPost('Город', post)

	expect(parsedPost).toMatchInlineSnapshot(`
		Object {
		  "audios": Array [
		    "Аудио: Pink Floyd - Money",
		  ],
		  "links": Array [],
		  "photos": Array [],
		  "repost": null,
		  "text": "Город
		https://vk.com/wall123_10

		Слушай аудио!

		Аудио: Pink Floyd - Money",
		  "videos": Array [],
		}
	`)
})

it('parses repost', async () => {
	const post = generatePost({
		text: `Зацените эту группу!`,
		copy_history: [generatePost({ owner_id: 222, text: 'Всем привет!' })],
	})

	mockGetGroupById.mockResolvedValue([
		{ id: 222, name: 'Какая-то группа', screen_name: 'group_alias' },
	])

	const parsedPost = await parseWallPost('Город', post)

	expect(parsedPost).toMatchInlineSnapshot(`
		Object {
		  "audios": Array [],
		  "links": Array [],
		  "photos": Array [],
		  "repost": Object {
		    "audios": Array [],
		    "links": Array [],
		    "photos": Array [],
		    "repost": null,
		    "text": "Какая-то группа
		https://vk.com/wall222_10

		Всем привет!",
		    "videos": Array [],
		  },
		  "text": "Город
		https://vk.com/wall123_10

		Зацените эту группу!",
		  "videos": Array [],
		}
	`)
})
