import { TelegrafContext } from 'telegraf/typings/context'

const helpText = [
	'Привет! Я бот отслеживания постов в группах Вконтакте.',
	'Просто пиши мне ссылки на группы, я начну их отслеживать и публиковать сюда обновления.',
	'Получается не всегда хорошо, но я очень стараюсь.\n',
	'Доступные команды:',
	'/list - список отслеживаемых групп',
	'/del - удалить группу из отслеживаемых',
].join('\n')

/** справка */
export function help<T extends TelegrafContext>(ctx: T): Promise<unknown> {
	return ctx.reply(helpText, { disable_web_page_preview: true })
}
