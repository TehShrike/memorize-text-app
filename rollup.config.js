import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import svelte from 'rollup-plugin-svelte'
import minify from 'rollup-plugin-babel-minify'

const optionalPlugins = process.env.NODE_ENV === `development`
	? []
	: [ minify() ]

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
		...optionalPlugins,
	],
	watch: {
		exclude: [ `node_modules/**` ],
		include: [],
	},
}
