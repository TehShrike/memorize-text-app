import settings from './settings.html'

export default mediator => ({
	name: `settings`,
	//defaultChild: `select-sheet`,
	route: `settings/:key`,
	template: settings,
	async resolve(data, { key }) {
        const workbook = await mediator.call(`getWorkbook`, key)

		return {
            workbook,
            key,
		}
	},
})