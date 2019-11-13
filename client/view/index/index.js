import Index from './Index.svelte';

export default mediator => ({
	name: `index`,
	route: `home`,
	template: Index,
	async resolve() {
		return {
			seenWorkbooks: await mediator.call(`getAllSeenWorkbooks`),
		};
	},
});
