/**
 * Декорирует функцию, возвращающую промис, чтобы она
 * никогда не бросала ошибку
 */
export function runPromiseSafe<T, TArgs extends any[]>(
	fn: (...args: TArgs) => Promise<T>,
) {
	return async function (...args: TArgs): Promise<{ data: T } | { error: Error }> {
		try {
			const data = await fn(...args)
			return { data }
		} catch (error) {
			return { error }
		}
	}
}
