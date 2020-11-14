const isTest = process.env.NODE_ENV === 'test'

module.exports = {
	presets: ['@babel/preset-typescript'],
	plugins: [
		isTest && '@babel/plugin-transform-modules-commonjs',
		'babel-plugin-transform-typescript-metadata',
		['@babel/plugin-proposal-decorators', { legacy: true }],
		['@babel/plugin-proposal-class-properties', { loose: true }],
		'@babel/plugin-proposal-optional-chaining',
	].filter(Boolean),
}
