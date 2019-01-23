import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'

export default {
	input: `client/globbed-tests.js`,
	output: {
		name: 'memorizeTextAppTests',
		format: `iife`,
		sourcemap: 'inline',
	},
	plugins: [
		commonjs(),
		resolve({
			browser: true,
		}),
	],
	watch: {
		exclude: [ `node_modules/**` ],
		include: [ `client/**` ],
	},
}
