import Sheet from './Sheet.html'

export default mediator => ({
	name: `workbook.sheet`,
	route: `sheet/:sheetId`,
	defaultChild: `memorize`,
	template: Sheet,
	async resolve(data, { key, sheetId }) {
		const sheet = await mediator.call(`getSheet`, key, sheetId)

		return {
			sheet,
			sheetId,
		}
	},
})
