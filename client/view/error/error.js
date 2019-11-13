import ErrorPage from './Error.svelte';

export default mediator => ({
	name: `error`,
	route: `error`,
	querystringParameters: [`key`],
	template: ErrorPage,
	async resolve(data, params) {
		return params;
	},
});
