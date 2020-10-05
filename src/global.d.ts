declare module 'markdown-escape' {
	export default function markdownEscape(str: string): string
}

declare namespace NodeJS {
	export interface ProcessEnv {
		BOT_TOKEN: string
		VK_SERVICE_TOKEN: string
		MONGODB_URI: string
	}
}
