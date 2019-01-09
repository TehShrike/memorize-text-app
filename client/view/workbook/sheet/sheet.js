import Sheet from './Sheet.html'

export default mediator => ({
	name: `workbook.sheet`,
	route: `sheet/:sheetId`,
	template: Sheet,
	async resolve(data, { sheetId }) {
		const sheet = await mediator.call(`getSheet`, sheetId)

		return {
			sheet,
			sheetId,
		}
	},
})
