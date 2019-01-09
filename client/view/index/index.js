import Index from './Index.html'

export default mediator => ({
	name: `index`,
	route: `home`,
	template: Index,
	activate(context) {
		const { domApi: component } = context
		component.on(`keySelected`, key => {
			mediator.call(`stateGo`, `workbook`, { key })
		})
	},
})
