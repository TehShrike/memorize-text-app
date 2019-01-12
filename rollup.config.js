import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import svelte from 'rollup-plugin-svelte'
import minify from 'rollup-plugin-babel-minify'
import visualizer from 'rollup-plugin-visualizer'

const optionalPlugins = process.env.NODE_ENV === `development`
	? [ ]
	: [
		minify(),
		visualizer({
			filename: `./public/bundle.html`,
			title: `Pre-minified code size`,
		}),
	]

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
