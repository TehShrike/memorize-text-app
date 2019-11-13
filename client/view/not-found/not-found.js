import NotFound from './NotFound.svelte';

export default mediator => ({
	name: `not-found`,
	route: `not-found`,
	querystringParameters: [`route`, `parameters`],
	template: NotFound,
	async resolve(data, parameters) {
		return parameters;
	},
});
