import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import svelte from 'rollup-plugin-svelte'

export default {
	input: `client/index.js`,
	output: {
		format: `iife`,
		file: `public/build.js`,
		sourcemap: true,
	},
	plugins: [
		svelte(),
		commonjs(),
		resolve({
			browser: true,
		}),
	],
	watch: {
		exclude: [ `node_modules/**` ],
		include: [],
	},
}
